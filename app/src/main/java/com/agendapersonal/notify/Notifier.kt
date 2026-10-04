package com.agendapersonal.notify

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.os.Build
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.agendapersonal.R
import com.agendapersonal.sections.Digest
import com.agendapersonal.sections.Section
import com.agendapersonal.ui.MainActivity

object Notifier {
    const val CH_DIGEST = "digest"
    const val CH_REMINDERS = "reminders"
    const val CH_WORK = "work"

    /** A dónde debe llevar el toque: "section:<id>", "tab:tasks", "tab:appts", "edit_task:<id>", "edit_appt:<id>". */
    const val EXTRA_TARGET = "target"

    const val ACTION_DELETE = "com.agendapersonal.action.DELETE"
    const val ACTION_KEEP = "com.agendapersonal.action.KEEP"

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

    private fun openIntent(context: Context, requestCode: Int, target: String) = PendingIntent.getActivity(
        context, requestCode,
        Intent(context, MainActivity::class.java)
            .putExtra(EXTRA_TARGET, target)
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    /** Icono grande: cuadrado redondeado de color con un emoji. */
    fun emojiIcon(emoji: String, color: Int, size: Int = 192): Bitmap {
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = (color and 0x00FFFFFF) or 0x2E000000 }
        c.drawRoundRect(RectF(0f, 0f, size.toFloat(), size.toFloat()), size * 0.3f, size * 0.3f, bg)
        val tp = Paint(Paint.ANTI_ALIAS_FLAG).apply { textSize = size * 0.55f; textAlign = Paint.Align.CENTER }
        val y = size / 2f - (tp.descent() + tp.ascent()) / 2f
        c.drawText(emoji, size / 2f, y, tp)
        return bmp
    }

    /** Vistas personalizadas del resumen (compacta y expandida). Visible también para pruebas. */
    fun digestViews(context: Context, section: Section, digest: Digest): Pair<RemoteViews, RemoteViews> {
        val collapsed = RemoteViews(context.packageName, R.layout.notif_collapsed).apply {
            setInt(R.id.accent_bar, "setBackgroundColor", section.accent)
            setTextViewText(R.id.title, "${section.emoji}  ${digest.title}")
            setTextViewText(R.id.summary, digest.preview.firstOrNull() ?: digest.summary)
        }
        val ids = intArrayOf(R.id.line1, R.id.line2, R.id.line3, R.id.line4, R.id.line5, R.id.line6)
        val hasChart = com.agendapersonal.sections.WeatherData.fromJson(digest.extra) != null
        // Con gráfica se omite la línea de horas en texto (sería redundante).
        val lines = digest.preview.ifEmpty { digest.body.lines().filter { it.isNotBlank() }.take(6) }
            .filterNot { hasChart && it.startsWith("⏰") }
        val expanded = RemoteViews(context.packageName, R.layout.notif_expanded).apply {
            setInt(R.id.accent_bar, "setBackgroundColor", section.accent)
            setTextViewText(R.id.title, "${section.emoji}  ${digest.title}")
            // Tiempo: gráfica por horas dentro de la notificación expandida.
            val weather = com.agendapersonal.sections.WeatherData.fromJson(digest.extra)
            if (weather != null) {
                setImageViewBitmap(R.id.chart, WeatherChartBitmap.render(weather.hours))
                setViewVisibility(R.id.chart, android.view.View.VISIBLE)
            }
            ids.forEachIndexed { i, id ->
                if (i < lines.size) { setTextViewText(id, lines[i]); setViewVisibility(id, android.view.View.VISIBLE) }
            }
        }
        return collapsed to expanded
    }

    fun postDigest(context: Context, section: Section, digest: Digest) {
        val (collapsed, expanded) = digestViews(context, section, digest)
        val n = NotificationCompat.Builder(context, CH_DIGEST)
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(section.accent)
            .setLargeIcon(emojiIcon(section.emoji, section.accent))
            .setContentTitle(digest.title)
            .setContentText(digest.summary)
            .setSubText(section.title)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .setCustomContentView(collapsed)
            .setCustomBigContentView(expanded)
            .setCategory(NotificationCompat.CATEGORY_RECOMMENDATION)
            .setContentIntent(openIntent(context, section.id.hashCode(), "section:${section.id}"))
            .setAutoCancel(true)
            .build()
        notify(context, 100 + (section.id.hashCode() and 0xFFFF), n)
    }

    /** Aviso de una tarea o cita, con las acciones Eliminar / Conservar / Modificar. */
    fun postReminder(context: Context, kind: String, id: Long, title: String, text: String, emoji: String, color: Int) {
        val notifId = (if (kind == Scheduler.KIND_APPT) 2_000_000 else 1_000_000) + id.toInt()
        val tab = if (kind == Scheduler.KIND_APPT) "tab:appts" else "tab:tasks"
        val editTarget = if (kind == Scheduler.KIND_APPT) "edit_appt:$id" else "edit_task:$id"
        fun action(act: String, offset: Int) = PendingIntent.getBroadcast(
            context, notifId * 4 + offset,
            Intent(context, ReminderActionReceiver::class.java).setAction(act)
                .putExtra(Scheduler.EXTRA_KIND, kind).putExtra(Scheduler.EXTRA_ID, id).putExtra("notif_id", notifId),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val n = NotificationCompat.Builder(context, CH_REMINDERS)
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(color)
            .setLargeIcon(emojiIcon(emoji, color))
            .setContentTitle(title)
            .setContentText(text)
            .setSubText(if (kind == Scheduler.KIND_APPT) "Cita médica" else "Tarea")
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(openIntent(context, notifId, tab))
            .setAutoCancel(true)
            .addAction(0, "Eliminar", action(ACTION_DELETE, 0))
            .addAction(0, "Conservar", action(ACTION_KEEP, 1))
            .addAction(0, "Modificar", openIntent(context, notifId * 4 + 2, editTarget))
            .build()
        notify(context, notifId, n)
    }

    @SuppressLint("MissingPermission")
    private fun notify(context: Context, id: Int, n: Notification) {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        NotificationManagerCompat.from(context).notify(id, n)
    }
}
