package com.agendapersonal.notify

import android.content.Context
import android.content.pm.ServiceInfo
import android.os.Build
import androidx.work.*
import com.agendapersonal.sections.DigestStore
import com.agendapersonal.sections.Section
import com.agendapersonal.sections.SectionRegistry

/** Genera el contenido de una sección (con red si hace falta) y publica la notificación. */
class DigestWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val id = inputData.getString(KEY_SECTION) ?: return Result.failure()
        val section = SectionRegistry.byId(id) ?: return Result.failure()

        val digest = runCatching { section.build(applicationContext) }.getOrNull()
        if ((digest == null || !digest.ok) && runAttemptCount < MAX_RETRIES) return Result.retry()

        val result = digest ?: com.agendapersonal.sections.Digest(
            section.title, "No se pudo obtener la información", "No se pudo obtener la información. Revisa tu conexión.", ok = false,
        )
        DigestStore.save(applicationContext, id, result)
        Notifier.postDigest(applicationContext, section, result)
        return Result.success()
    }

    override suspend fun getForegroundInfo(): ForegroundInfo {
        val n = Notifier.workNotification(applicationContext)
        return if (Build.VERSION.SDK_INT >= 29)
            ForegroundInfo(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        else ForegroundInfo(1, n)
    }

    companion object {
        private const val KEY_SECTION = "section"
        private const val MAX_RETRIES = 3

        fun enqueue(context: Context, section: Section) {
            val builder = OneTimeWorkRequestBuilder<DigestWorker>()
                .setInputData(workDataOf(KEY_SECTION to section.id))
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            if (section.needsNetwork) {
                builder.setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            }
            WorkManager.getInstance(context)
                .enqueueUniqueWork("digest_${section.id}", ExistingWorkPolicy.REPLACE, builder.build())
        }
    }
}
