package com.agendapersonal.notify

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.agendapersonal.data.AppDb
import com.agendapersonal.sections.SectionRegistry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val kind = intent.getStringExtra(Scheduler.EXTRA_KIND) ?: return
        val id = intent.getStringExtra(Scheduler.EXTRA_ID) ?: return
        val app = context.applicationContext
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                when (kind) {
                    Scheduler.KIND_SECTION -> SectionRegistry.byId(id)?.let {
                        Scheduler.scheduleSection(app, it) // reprograma el día siguiente
                        DigestWorker.enqueue(app, it)
                    }
                    Scheduler.KIND_TASK -> AppDb.get(app).tasks().get(id.toLong())?.let {
                        if (!it.done) Notifier.postReminder(app, Scheduler.KIND_TASK, it.id, "✅ ${it.title}", "Tienes una tarea pendiente.", "✅", 0xFF3B5BDB.toInt())
                    }
                    Scheduler.KIND_APPT -> AppDb.get(app).appointments().get(id.toLong())?.let {
                        val hour = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(it.at))
                        val where = if (it.place.isNotBlank()) "\n📍 ${it.place}" else ""
                        Notifier.postReminder(app, Scheduler.KIND_APPT, it.id, "🩺 ${it.title}", "Hoy a las $hour$where", "🩺", 0xFF0F9D8A.toInt())
                    }
                }
            } finally {
                pending.finish()
            }
        }
    }
}
