package com.agendapersonal

import android.app.Application
import com.agendapersonal.notify.Notifier
import com.agendapersonal.notify.Scheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        com.agendapersonal.sections.SectionRegistry.init(this)
        Notifier.createChannels(this)
        CoroutineScope(Dispatchers.IO).launch { Scheduler.rescheduleAll(this@App) }
    }
}
