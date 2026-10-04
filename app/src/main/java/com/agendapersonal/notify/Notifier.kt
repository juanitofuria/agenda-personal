package com.agendapersonal.notify

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.agendapersonal.R
import com.agendapersonal.sections.Digest
import com.agendapersonal.ui.MainActivity

object Notifier {
    const val CH_DIGEST = "digest"
    const val CH_REMINDERS = "reminders"
    const val CH_WORK = "work"
    const val EXTRA_SECTION = "section_id"

    fun createChannels(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CH_DIGEST, "Resúmenes diarios", NotificationManager.IMPORTANCE_DEFAULT))
        nm.createNotificationChannel(NotificationChannel(CH_REMINDERS, "Avisos de tareas y citas", NotificationManager.IMPORTANCE_HIGH))
        nm.createNotificationChannel(NotificationChannel(CH_WORK, "Actualizando datos", NotificationManager.IMPORTANCE_MIN))
    }

    fun workNotification(context: Context) =
        NotificationCompat.Builder(context, CH_WORK)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Preparando tu resumen…")
            .setOngoing(true)
            .build()

    fun postDigest(context: Context, sectionId: String, digest: Digest) {
        val open = PendingIntent.getActivity(
            context, sectionId.hashCode(),
            Intent(context, MainActivity::class.java)
                .putExtra(EXTRA_SECTION, sectionId)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val n = NotificationCompat.Builder(context, CH_DIGEST)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(digest.title)
            .setContentText(digest.summary)
            .setStyle(NotificationCompat.BigTextStyle().bigText(digest.body.ifBlank { digest.summary }))
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        notify(context, 100 + (sectionId.hashCode() and 0xFFFF), n)
    }

    fun postReminder(context: Context, notificationId: Int, title: String, text: String) {
        val open = PendingIntent.getActivity(
            context, notificationId, Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val n = NotificationCompat.Builder(context, CH_REMINDERS)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setContentIntent(open)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        notify(context, notificationId, n)
    }

    @SuppressLint("MissingPermission")
    private fun notify(context: Context, id: Int, n: android.app.Notification) {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        NotificationManagerCompat.from(context).notify(id, n)
    }
}
