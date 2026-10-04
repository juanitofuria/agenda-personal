package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.AppDb
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.time.ZoneId
import java.util.Date
import java.util.Locale

/** Resumen del día: citas de hoy y mañana, y tareas pendientes. Funciona sin Internet. */
object AgendaSection : Section {
    override val id = "agenda"
    override val title = "Agenda"
    override val description = "Citas médicas de hoy y mañana y tareas pendientes"
    override val defaultHour = 7
    override val defaultMinute = 20
    override val needsNetwork = false
    override val emoji = "🗓️"
    override val accent = 0xFF0F9D8A.toInt()

    override suspend fun build(context: Context): Digest {
        val db = AppDb.get(context)
        val zone = ZoneId.systemDefault()
        val start = LocalDate.now().atStartOfDay(zone).toInstant().toEpochMilli()
        val end = LocalDate.now().plusDays(2).atStartOfDay(zone).toInstant().toEpochMilli() - 1
        val appts = db.appointments().between(start, end)
        val tasks = db.tasks().pending()

        val hour = SimpleDateFormat("HH:mm", Locale.getDefault())
        val day = SimpleDateFormat("EEE d", Locale("es", "ES"))
        val tomorrow = LocalDate.now().plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()

        val body = buildString {
            append("🩺 CITAS (hoy y mañana)")
            if (appts.isEmpty()) append("\nSin citas.")
            appts.forEach {
                val label = if (it.at >= tomorrow) "mañana" else "hoy"
                append("\n• $label ${hour.format(Date(it.at))} – ${it.title}")
                if (it.place.isNotBlank()) append(" (${it.place})")
            }
            append("\n\n✅ TAREAS PENDIENTES")
            if (tasks.isEmpty()) append("\nNada pendiente 🎉")
            tasks.forEach {
                append("\n• ${it.title}")
                it.remindAt?.let { t -> append("  ⏰ ${day.format(Date(t))} ${hour.format(Date(t))}") }
            }
        }
        val preview = buildList {
            appts.take(3).forEach {
                val label = if (it.at >= tomorrow) "mañana" else "hoy"
                add("🩺 ${it.title} · $label ${hour.format(Date(it.at))}" + if (it.place.isNotBlank()) " (${it.place})" else "")
            }
            if (appts.isEmpty()) add("🩺 Sin citas hoy ni mañana")
            if (tasks.isEmpty()) add("✅ Nada pendiente")
            else {
                add("✅ ${tasks.size} tarea${if (tasks.size == 1) "" else "s"} pendiente${if (tasks.size == 1) "" else "s"}")
                tasks.take(2).forEach { add("• ${it.title}") }
            }
        }
        val summary = "${appts.size} cita(s) · ${tasks.size} tarea(s) pendiente(s)"
        return Digest("Tu agenda de hoy", summary, body, preview)
    }
}
