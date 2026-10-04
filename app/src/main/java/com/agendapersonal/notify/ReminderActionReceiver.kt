package com.agendapersonal.notify

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import com.agendapersonal.data.AppDb
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/** Botones "Eliminar" y "Conservar" de las notificaciones de tareas y citas. */
class ReminderActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val app = context.applicationContext
        val kind = intent.getStringExtra(Scheduler.EXTRA_KIND) ?: return
        val id = intent.getLongExtra(Scheduler.EXTRA_ID, -1)
        val notifId = intent.getIntExtra("notif_id", -1)
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                var message = "Evento conservado"
                if (intent.action == Notifier.ACTION_DELETE) {
                    val db = AppDb.get(app)
                    if (kind == Scheduler.KIND_APPT) db.appointments().get(id)?.let { Scheduler.cancelAppointment(app, it); db.appointments().delete(it) }
                    else db.tasks().get(id)?.let { Scheduler.cancelTask(app, it); db.tasks().delete(it) }
                    message = "Evento eliminado"
                }
                app.getSystemService(NotificationManager::class.java).cancel(notifId)
                Handler(Looper.getMainLooper()).post { Toast.makeText(app, message, Toast.LENGTH_SHORT).show() }
            } finally {
                pending.finish()
            }
        }
    }
}
