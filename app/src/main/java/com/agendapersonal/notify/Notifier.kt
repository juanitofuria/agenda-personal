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
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.agendapersonal.R
import com.agendapersonal.data.Prefs
import com.agendapersonal.sections.Digest
import com.agendapersonal.sections.Section
import com.agendapersonal.ui.MainActivity

object Notifier {
    const val CH_NEWS = "news"
    const val CH_WEATHER = "weather"
    const val CH_HOROSCOPE = "horoscope"
    const val CH_GENERAL = "general"
    const val CH_REMINDERS = "reminders"
    const val CH_APPOINTMENTS = "appointments"
    const val CH_URGENT = "urgent"
    const val CH_WORK = "work"
    const val EXTRA_TARGET = "target"
    const val ACTION_DELETE = "com.agendapersonal.action.DELETE"
    const val ACTION_KEEP = "com.agendapersonal.action.KEEP"

    private val SOUND_OPTIONS = listOf(
        "signature" to "Signature", "crystal" to "Crystal", "pulse" to "Pulse",
        "halo" to "Halo", "orbit" to "Orbit", "velvet" to "Velvet"
    )
    fun soundOptions(): List<Pair<String, String>> = SOUND_OPTIONS

    fun createChannels(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        createSilent(nm, CH_NEWS, "Noticias")
        createSilent(nm, CH_WEATHER, "Tiempo")
        createSilent(nm, CH_HOROSCOPE, "Horóscopo")
        createSilent(nm, CH_GENERAL, "Información general")
        createSounded(context, nm, CH_REMINDERS, "Recordatorios")
        createSounded(context, nm, CH_APPOINTMENTS, "Citas")
        createSounded(context, nm, CH_URGENT, "Avisos importantes", NotificationManager.IMPORTANCE_HIGH, true)
        createSilent(nm, CH_WORK, "Actualizando datos", NotificationManager.IMPORTANCE_MIN)
    }

    fun recreateSoundChannels(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        listOf(CH_REMINDERS, CH_APPOINTMENTS, CH_URGENT).forEach(nm::deleteNotificationChannel)
        createChannels(context)
    }

    private fun createSilent(nm: NotificationManager, id: String, name: String, importance: Int = NotificationManager.IMPORTANCE_DEFAULT) {
        if (Build.VERSION.SDK_INT < 26) return
        val ch = NotificationChannel(id, "Agenda Personal — $name", importance)
        ch.setSound(null, null)
        ch.enableVibration(false)
        ch.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        nm.createNotificationChannel(ch)
    }

    private fun createSounded(context: Context, nm: NotificationManager, id: String, name: String, importance: Int = NotificationManager.IMPORTANCE_HIGH, urgent: Boolean = false) {
        if (Build.VERSION.SDK_INT < 26) return
        val ch = NotificationChannel(id, "Agenda Personal — $name", importance)
        ch.setSound(soundUri(context, Prefs(context).notificationSound), AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
        ch.enableVibration(true)
        ch.vibrationPattern = if (urgent) longArrayOf(0, 180, 90, 180) else longArrayOf(0, 100, 70, 100)
        ch.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        nm.createNotificationChannel(ch)
    }

    private fun soundUri(context: Context, key: String): Uri {
        val name = when (key) {
            "crystal" -> "agenda_crystal"; "pulse" -> "agenda_pulse"; "halo" -> "agenda_halo"
            "orbit" -> "agenda_orbit"; "velvet" -> "agenda_velvet"; else -> "agenda_signature"
        }
        return Uri.parse("android.resource://${context.packageName}/raw/$name")
    }

    fun workNotification(context: Context) = NotificationCompat.Builder(context, CH_WORK)
        .setSmallIcon(R.drawable.ic_notification).setContentTitle("Preparando tu resumen…").setOngoing(true).build()

    private fun openIntent(context: Context, requestCode: Int, target: String) = PendingIntent.getActivity(
        context, requestCode, Intent(context, MainActivity::class.java).putExtra(EXTRA_TARGET, target)
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)

    fun emojiIcon(emoji: String, color: Int, size: Int = 192): Bitmap {
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = (color and 0x00FFFFFF) or 0x2E000000 }
        c.drawRoundRect(RectF(0f, 0f, size.toFloat(), size.toFloat()), size * 0.3f, size * 0.3f, bg)
        val tp = Paint(Paint.ANTI_ALIAS_FLAG).apply { textSize = size * 0.55f; textAlign = Paint.Align.CENTER }
        val y = size / 2f - (tp.descent() + tp.ascent()) / 2f
        c.drawText(emoji, size / 2f, y, tp); return bmp
    }

    fun digestViews(context: Context, section: Section, digest: Digest): Pair<RemoteViews, RemoteViews> {
        val collapsed = RemoteViews(context.packageName, R.layout.notif_collapsed).apply {
            setInt(R.id.accent_bar, "setBackgroundColor", section.accent)
            setTextViewText(R.id.title, "${section.emoji}  ${digest.title}")
            setTextViewText(R.id.summary, digest.preview.firstOrNull() ?: digest.summary)
        }
        val ids = intArrayOf(R.id.line1, R.id.line2, R.id.line3, R.id.line4, R.id.line5, R.id.line6)
        val hasChart = com.agendapersonal.sections.WeatherData.fromJson(digest.extra) != null
        val lines = digest.preview.ifEmpty { digest.body.lines().filter { it.isNotBlank() }.take(6) }
            .filterNot { hasChart && it.startsWith("⏰") }
        val expanded = RemoteViews(context.packageName, R.layout.notif_expanded).apply {
            setInt(R.id.accent_bar, "setBackgroundColor", section.accent)
            setTextViewText(R.id.title, "${section.emoji}  ${digest.title}")
            val weather = com.agendapersonal.sections.WeatherData.fromJson(digest.extra)
            if (weather != null) { setImageViewBitmap(R.id.chart, WeatherChartBitmap.render(weather.hours)); setViewVisibility(R.id.chart, android.view.View.VISIBLE) }
            ids.forEachIndexed { i, id -> if (i < lines.size) { setTextViewText(id, lines[i]); setViewVisibility(id, android.view.View.VISIBLE) } }
        }
        return collapsed to expanded
    }

    private fun digestChannel(section: Section): String = when (section.id) {
        "news" -> CH_NEWS; "weather" -> CH_WEATHER; "horoscope" -> CH_HOROSCOPE; else -> CH_GENERAL
    }

    fun postDigest(context: Context, section: Section, digest: Digest) {
        val (collapsed, expanded) = digestViews(context, section, digest)
        val n = NotificationCompat.Builder(context, digestChannel(section))
            .setSmallIcon(R.drawable.ic_notification).setColor(section.accent).setLargeIcon(emojiIcon(section.emoji, section.accent))
            .setContentTitle(digest.title).setContentText(digest.summary).setSubText(section.title)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle()).setCustomContentView(collapsed).setCustomBigContentView(expanded)
            .setCategory(NotificationCompat.CATEGORY_RECOMMENDATION)
            .setContentIntent(openIntent(context, section.id.hashCode(), "section:${section.id}")).setAutoCancel(true).build()
        notify(context, 100 + (section.id.hashCode() and 0xFFFF), n)
    }

    fun postReminder(context: Context, kind: String, id: Long, title: String, text: String, emoji: String, color: Int) {
        val notifId = (if (kind == Scheduler.KIND_APPT) 2_000_000 else 1_000_000) + id.toInt()
        val tab = if (kind == Scheduler.KIND_APPT) "tab:appts" else "tab:tasks"
        val editTarget = if (kind == Scheduler.KIND_APPT) "edit_appt:$id" else "edit_task:$id"
        val channel = if (kind == Scheduler.KIND_APPT) CH_APPOINTMENTS else CH_REMINDERS
        fun action(act: String, offset: Int) = PendingIntent.getBroadcast(context, notifId * 4 + offset,
            Intent(context, ReminderActionReceiver::class.java).setAction(act)
                .putExtra(Scheduler.EXTRA_KIND, kind).putExtra(Scheduler.EXTRA_ID, id).putExtra("notif_id", notifId),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(context, channel)
            .setSmallIcon(R.drawable.ic_notification).setColor(color).setLargeIcon(emojiIcon(emoji, color))
            .setContentTitle(title).setContentText(text)
            .setSubText(if (kind == Scheduler.KIND_APPT) "Cita" else "Recordatorio")
            .setStyle(NotificationCompat.BigTextStyle().bigText(text)).setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_HIGH).setContentIntent(openIntent(context, notifId, tab)).setAutoCancel(true)
            .addAction(0, "Eliminar", action(ACTION_DELETE, 0)).addAction(0, "Conservar", action(ACTION_KEEP, 1))
            .addAction(0, "Modificar", openIntent(context, notifId * 4 + 2, editTarget)).build()
        notify(context, notifId, n)
    }

    @SuppressLint("MissingPermission")
    private fun notify(context: Context, id: Int, n: Notification) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        NotificationManagerCompat.from(context).notify(id, n)
    }
}
