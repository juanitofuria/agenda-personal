package com.agendapersonal

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import androidx.test.core.app.ApplicationProvider
import com.agendapersonal.data.AppDb
import com.agendapersonal.data.Appointment
import com.agendapersonal.data.Task
import com.agendapersonal.notify.Notifier
import com.agendapersonal.notify.ReminderActionReceiver
import com.agendapersonal.notify.Scheduler
import com.agendapersonal.sections.Digest
import com.agendapersonal.sections.DigestStore
import com.agendapersonal.sections.WeatherSection
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class BehaviorTest {
    private val ctx: Context get() = ApplicationProvider.getApplicationContext()
    private val nm get() = ctx.getSystemService(NotificationManager::class.java)

    @Before fun setUp() {
        Notifier.createChannels(ctx)
        shadowOf(ctx as android.app.Application).grantPermissions(android.Manifest.permission.POST_NOTIFICATIONS)
        runBlocking { withContext(Dispatchers.IO) { AppDb.get(ctx).clearAllTables() } }
    }

    @Test fun digestStoreRoundTrip() {
        DigestStore.save(ctx, "weather", Digest("Tiempo · Montoro", "resumen", "cuerpo\n\nmás", listOf("a", "b")))
        val s = DigestStore.load(ctx, "weather")!!
        assertEquals("Tiempo · Montoro", s.title); assertEquals(listOf("a", "b"), s.preview); assertEquals("cuerpo\n\nmás", s.body)
        assertTrue(s.at > 0)
        assertNull(DigestStore.load(ctx, "news"))
    }

    @Test fun digestNotificationOpensOnlyItsSection() {
        Notifier.postDigest(ctx, WeatherSection, Digest("Tiempo · Montoro", "x", "body", listOf("l1", "l2")))
        val n = shadowOf(nm).allNotifications.single()
        assertNotNull(n.bigContentView)
        val intent = shadowOf(n.contentIntent).savedIntent
        assertEquals("section:weather", intent.getStringExtra(Notifier.EXTRA_TARGET))
    }

    @Test fun reminderHasDeleteKeepModifyActions() = runBlocking {
        val db = AppDb.get(ctx)
        val id = withContext(Dispatchers.IO) { db.appointments().insert(Appointment(title = "Cardiología", place = "Hospital", at = System.currentTimeMillis() + 3_600_000)) }
        Notifier.postReminder(ctx, Scheduler.KIND_APPT, id, "🩺 Cardiología", "Hoy", "🩺", 0xFF0F9D8A.toInt())
        val n = shadowOf(nm).allNotifications.single()
        assertEquals(listOf("Eliminar", "Conservar", "Modificar"), n.actions.map { it.title.toString() })
        assertEquals("edit_appt:$id", shadowOf(n.actions[2].actionIntent).savedIntent.getStringExtra(Notifier.EXTRA_TARGET))
        assertEquals("tab:appts", shadowOf(n.contentIntent).savedIntent.getStringExtra(Notifier.EXTRA_TARGET))
    }

    private fun press(action: String, kind: String, id: Long, notifId: Int) {
        ctx.sendBroadcast(
            Intent(ctx, ReminderActionReceiver::class.java).setAction(action)
                .putExtra(Scheduler.EXTRA_KIND, kind).putExtra(Scheduler.EXTRA_ID, id).putExtra("notif_id", notifId),
        )
        // El receptor trabaja en un hilo de fondo: se espera a que termine.
        val end = System.currentTimeMillis() + 5000
        while (System.currentTimeMillis() < end) { shadowOf(android.os.Looper.getMainLooper()).idle(); Thread.sleep(50); if (nm.activeNotifications.isEmpty()) break }
    }

    @Test fun deleteButtonRemovesTaskAndNotification() = runBlocking {
        val db = AppDb.get(ctx)
        val id = withContext(Dispatchers.IO) { db.tasks().insert(Task(title = "Llamar", remindAt = System.currentTimeMillis() + 1000)) }
        Notifier.postReminder(ctx, Scheduler.KIND_TASK, id, "✅ Llamar", "x", "✅", 0)
        assertEquals(1, shadowOf(nm).allNotifications.size)
        press(Notifier.ACTION_DELETE, Scheduler.KIND_TASK, id, 1_000_000 + id.toInt())
        assertNull(withContext(Dispatchers.IO) { db.tasks().get(id) })
        assertTrue(shadowOf(nm).allNotifications.isEmpty())
    }

    @Test fun keepButtonKeepsAppointmentButClearsNotification() = runBlocking {
        val db = AppDb.get(ctx)
        val id = withContext(Dispatchers.IO) { db.appointments().insert(Appointment(title = "Dentista", at = System.currentTimeMillis() + 3_600_000)) }
        Notifier.postReminder(ctx, Scheduler.KIND_APPT, id, "🩺 Dentista", "x", "🩺", 0)
        press(Notifier.ACTION_KEEP, Scheduler.KIND_APPT, id, 2_000_000 + id.toInt())
        assertNotNull(withContext(Dispatchers.IO) { db.appointments().get(id) })
        assertTrue(shadowOf(nm).allNotifications.isEmpty())
    }
}
