import asyncio
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_source import DataSource
from app.models.extraction_job import ExtractionJob, ExtractionJobStatus
from app.models.project_extraction import ProjectExtraction


SIMULATED_BATCHES = 5
SIMULATED_BATCH_DELAY_SECONDS = 2
SIMULATED_ROWS_PER_BATCH = 100


async def run_extraction_job(job_id: UUID, db: AsyncSession) -> None:
    job = await db.scalar(select(ExtractionJob).where(ExtractionJob.id == job_id))
    if job is None:
        return

    try:
        job.status = ExtractionJobStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        job.completed_at = None
        job.error_message = None
        await db.commit()

        project_extraction = await db.scalar(
            select(ProjectExtraction).where(ProjectExtraction.id == job.project_extraction_id)
        )
        if project_extraction is None:
            raise ValueError("Project extraction not found.")

        data_source = await db.scalar(select(DataSource).where(DataSource.id == project_extraction.data_source_id))
        if data_source is None:
            raise ValueError("Data source not found.")

        for batch_index in range(1, SIMULATED_BATCHES + 1):
            await asyncio.sleep(SIMULATED_BATCH_DELAY_SECONDS)
            job.total_rows_extracted += SIMULATED_ROWS_PER_BATCH
            job.last_cursor_value = f"batch-{batch_index}"
            await db.commit()

        job.status = ExtractionJobStatus.COMPLETED
        job.completed_at = datetime.now(timezone.utc)
        await db.commit()
    except Exception as exc:
        await db.rollback()
        failed_job = await db.scalar(select(ExtractionJob).where(ExtractionJob.id == job_id))
        if failed_job is None:
            return

        failed_job.status = ExtractionJobStatus.FAILED
        failed_job.error_message = str(exc)
        failed_job.completed_at = datetime.now(timezone.utc)
        await db.commit()
