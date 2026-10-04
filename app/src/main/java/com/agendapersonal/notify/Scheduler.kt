package com.agendapersonal.notify

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.agendapersonal.data.AppDb
import com.agendapersonal.data.Appointment
import com.agendapersonal.data.Prefs
import com.agendapersonal.data.Task
import com.agendapersonal.sections.Section
import com.agendapersonal.sections.SectionRegistry
import java.time.LocalDateTime
import java.time.ZoneId

/** Programa las alarmas de las secciones diarias y de los avisos de tareas y citas. */
object Scheduler {
    const val EXTRA_KIND = "kind"
    const val EXTRA_ID = "id"
    const val KIND_SECTION = "section"
    const val KIND_TASK = "task"
    const val KIND_APPT = "appt"

    private const val TASK_BASE = 1_000_000
    private const val APPT_BASE = 2_000_000

    /** Próxima ocurrencia de HH:mm (hoy si aún no ha pasado, si no mañana). */
    fun nextTrigger(hour: Int, minute: Int): Long {
        val zone = ZoneId.systemDefault()
        val now = LocalDateTime.now()
        var t = now.toLocalDate().atTime(hour, minute)
        if (!t.isAfter(now)) t = t.plusDays(1)
        return t.atZone(zone).toInstant().toEpochMilli()
    }

    fun scheduleSection(context: Context, section: Section) {
        val prefs = Prefs(context)
        val index = sectionCode(section.id)
        if (!prefs.isEnabled(section)) {
            cancel(context, index, KIND_SECTION, section.id)
            return
        }
        val at = nextTrigger(prefs.hour(section.id, section.defaultHour), prefs.minute(section.id, section.defaultMinute))
        set(context, index, KIND_SECTION, section.id, at)
    }

    /** Código de alarma estable por sección (no depende del orden, que cambia al añadir o quitar secciones). */
    private fun sectionCode(id: String) = (id.hashCode() and 0x7FFFFFFF) % 900_000

    /** Cancela la alarma de una sección que ya no existe (p. ej. una personalizada eliminada). */
    fun cancelSection(context: Context, id: String) = cancel(context, sectionCode(id), KIND_SECTION, id)

    fun scheduleTask(context: Context, task: Task) {
        val at = task.remindAt
        if (task.done || at == null || at <= System.currentTimeMillis()) {
            cancel(context, TASK_BASE + task.id.toInt(), KIND_TASK, task.id.toString())
        } else {
            set(context, TASK_BASE + task.id.toInt(), KIND_TASK, task.id.toString(), at)
        }
    }

    fun cancelTask(context: Context, task: Task) =
        cancel(context, TASK_BASE + task.id.toInt(), KIND_TASK, task.id.toString())

    fun scheduleAppointment(context: Context, a: Appointment) {
        val at = a.at - a.remindMinutesBefore * 60_000L
        if (at <= System.currentTimeMillis()) {
            cancel(context, APPT_BASE + a.id.toInt(), KIND_APPT, a.id.toString())
        } else {
            set(context, APPT_BASE + a.id.toInt(), KIND_APPT, a.id.toString(), at)
        }
    }

    fun cancelAppointment(context: Context, a: Appointment) =
        cancel(context, APPT_BASE + a.id.toInt(), KIND_APPT, a.id.toString())

    /** Se llama al arrancar la app, tras reiniciar el móvil o al cambiar la hora/zona. */
    suspend fun rescheduleAll(context: Context) {
        SectionRegistry.all.forEach { scheduleSection(context, it) }
        val db = AppDb.get(context)
        db.tasks().pending().forEach { scheduleTask(context, it) }
        db.appointments().upcoming(System.currentTimeMillis()).forEach { scheduleAppointment(context, it) }
    }

    fun canScheduleExact(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        return (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).canScheduleExactAlarms()
    }

    private fun pending(context: Context, requestCode: Int, kind: String, id: String, create: Boolean): PendingIntent? {
        val intent = Intent(context, AlarmReceiver::class.java)
            .putExtra(EXTRA_KIND, kind)
            .putExtra(EXTRA_ID, id)
        val flags = PendingIntent.FLAG_IMMUTABLE or
            if (create) PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_NO_CREATE
        return PendingIntent.getBroadcast(context, requestCode, intent, flags)
    }

    private fun set(context: Context, requestCode: Int, kind: String, id: String, at: Long) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = pending(context, requestCode, kind, id, create = true)!!
        if (canScheduleExact(context)) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
        else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi) // sin permiso: puede retrasarse unos minutos
    }

    private fun cancel(context: Context, requestCode: Int, kind: String, id: String) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        pending(context, requestCode, kind, id, create = false)?.let { am.cancel(it); it.cancel() }
    }
}
