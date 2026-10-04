package com.agendapersonal.notify

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/** Reprograma todas las alarmas tras reiniciar, actualizar la app o cambiar hora/zona horaria. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val app = context.applicationContext
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try { Scheduler.rescheduleAll(app) } finally { pending.finish() }
        }
    }
}
