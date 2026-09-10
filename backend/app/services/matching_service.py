import logging
import math
import re
from collections import Counter

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.db.models.report import Report, ReportStatus, ReportType
from app.db.models.match import Match, MatchStatus
from app.db.models.notification import Notification


logger = logging.getLogger(__name__)

MATCH_THRESHOLD = 0.3


def _char_ngrams(text: str, n_min: int = 2, n_max: int = 3) -> list[str]:
    """
    Generate character n-grams (2 and 3 char sequences) from text.
    Mirrors the char-ngram TF-IDF approach: forgiving of typos, plurals,
    and slightly different phrasing between user-typed descriptions.
    """
    text = re.sub(r"\s+", " ", text.lower().strip())
    ngrams = []
    for n in range(n_min, n_max + 1):
        for i in range(len(text) - n + 1):
            ngrams.append(text[i:i + n])
    return ngrams


def _tf(ngrams: list[str]) -> Counter:
    """Term frequency: count of each n-gram in the document."""
    return Counter(ngrams)


def _idf(all_docs_ngrams: list[list[str]]) -> dict[str, float]:
    """
    Inverse document frequency across all documents (input report + candidates).
    Standard smoothed IDF: log((1 + N) / (1 + df)) + 1
    """
    n_docs = len(all_docs_ngrams)
    df: Counter = Counter()
    for doc_ngrams in all_docs_ngrams:
        for term in set(doc_ngrams):
            df[term] += 1

    idf = {}
    for term, freq in df.items():
        idf[term] = math.log((1 + n_docs) / (1 + freq)) + 1
    return idf


def _tfidf_vector(tf_counts: Counter, idf: dict[str, float]) -> dict[str, float]:
    """Combine TF and IDF into a single TF-IDF weight vector."""
    return {term: count * idf.get(term, 0.0) for term, count in tf_counts.items()}


def _cosine_similarity(vec_a: dict[str, float], vec_b: dict[str, float]) -> float:
    """Cosine similarity between two sparse TF-IDF vectors (dicts)."""
    if not vec_a or not vec_b:
        return 0.0

    common_terms = set(vec_a.keys()) & set(vec_b.keys())
    dot_product = sum(vec_a[t] * vec_b[t] for t in common_terms)

    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)


def _text_similarity(text_a: str, text_b: str, all_texts: list[str]) -> float:
    """
    Compute TF-IDF cosine similarity between two texts, using the full
    all_texts corpus to compute IDF (so rare/distinctive terms count more).
    """
    all_ngrams = [_char_ngrams(t) for t in all_texts]
    idf = _idf(all_ngrams)

    vec_a = _tfidf_vector(_tf(_char_ngrams(text_a)), idf)
    vec_b = _tfidf_vector(_tf(_char_ngrams(text_b)), idf)

    return _cosine_similarity(vec_a, vec_b)


def find_potential_matches(report: Report, db: Session) -> list[dict]:
    """
    Find potential matches for a report using text similarity and metadata boosting.

    Args:
        report: The Report object to find matches for
        db: Database session

    Returns:
        List of dicts with "report" (Report object) and "score" (float 0-1) keys,
        sorted by score descending. Only includes matches with score >= 0.3.
    """
    # Determine opposite report type
    opposite_type = ReportType.FOUND if report.report_type == ReportType.LOST else ReportType.LOST

    # Fetch candidate reports: opposite type, not resolved
    stmt = select(Report).where(
        and_(
            Report.report_type == opposite_type,
            Report.status != ReportStatus.RESOLVED
        )
    )
    result = db.execute(stmt)
    candidates = result.scalars().all()

    if not candidates:
        return []

    # Create combined text for input report and all candidates
    input_text = f"{report.item_name} {report.category} {report.description}"
    candidate_texts = [
        f"{c.item_name} {c.category} {c.description}"
        for c in candidates
    ]
    all_texts = [input_text] + candidate_texts

    # Precompute IDF once across the whole corpus (input + all candidates)
    all_ngrams = [_char_ngrams(t) for t in all_texts]
    idf = _idf(all_ngrams)
    input_vec = _tfidf_vector(_tf(all_ngrams[0]), idf)

    matches = []
    for idx, candidate in enumerate(candidates):
        candidate_vec = _tfidf_vector(_tf(all_ngrams[idx + 1]), idf)
        score = _cosine_similarity(input_vec, candidate_vec)

        # Apply boosters
        if report.category.lower() == candidate.category.lower():
            score += 0.1
        if report.location.lower() == candidate.location.lower():
            score += 0.1
        date_diff = abs((report.date_occurred - candidate.date_occurred).days)
        if date_diff <= 3:
            score += 0.1

        score = min(score, 1.0)

        if score >= MATCH_THRESHOLD:
            matches.append({
                "report": candidate,
                "score": score
            })

    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches


def create_matches_for_report(report: Report, db: Session) -> list[Match]:
    """
    Find potential matches for a report and create Match records and Notifications.

    Args:
        report: The Report object to find matches for
        db: Database session

    Returns:
        List of newly created Match objects

    Raises:
        Logs errors but does not raise exceptions
    """
    try:
        potential_matches = find_potential_matches(report, db)

        created_matches = []
        for match_dict in potential_matches:
            candidate = match_dict["report"]
            score = match_dict["score"]

            # Check if Match already exists (in either direction)
            existing_stmt = select(Match).where(
                or_(
                    and_(
                        Match.lost_report_id == report.id,
                        Match.found_report_id == candidate.id
                    ),
                    and_(
                        Match.lost_report_id == candidate.id,
                        Match.found_report_id == report.id
                    )
                )
            )
            existing_result = db.execute(existing_stmt)
            existing_match = existing_result.scalar_one_or_none()

            if existing_match is None:
                if report.report_type == ReportType.LOST:
                    lost_id = report.id
                    found_id = candidate.id
                else:
                    lost_id = candidate.id
                    found_id = report.id

                new_match = Match(
                    lost_report_id=lost_id,
                    found_report_id=found_id,
                    similarity_score=score,
                    status=MatchStatus.PENDING
                )

                db.add(new_match)
                created_matches.append((new_match, report, candidate))

        if created_matches:
            db.commit()
            for match, input_report, candidate_report in created_matches:
                db.refresh(match)
                
                # Create notifications for both report owners
                lost_report = input_report if input_report.report_type == ReportType.LOST else candidate_report
                found_report = candidate_report if input_report.report_type == ReportType.LOST else input_report
                
                # Notification for lost report owner
                lost_notification = Notification(
                    user_id=lost_report.user_id,
                    message=f"Potential match found for your lost report: {lost_report.item_name}",
                    is_read=False,
                    related_match_id=match.id
                )
                db.add(lost_notification)
                
                # Notification for found report owner
                found_notification = Notification(
                    user_id=found_report.user_id,
                    message=f"Potential match found for your found report: {found_report.item_name}",
                    is_read=False,
                    related_match_id=match.id
                )
                db.add(found_notification)
            
            db.commit()

        return [match for match, _, _ in created_matches]

    except Exception as e:
        logger.error(f"Error creating matches for report {report.id}: {str(e)}")
        return []