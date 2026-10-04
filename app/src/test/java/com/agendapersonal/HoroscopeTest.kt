package com.agendapersonal

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.agendapersonal.data.Prefs
import com.agendapersonal.sections.*
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.time.LocalDate

/** Lógica de caché/servidor del repositorio, tal y como la describe la guía de Firebase. */
class HoroscopoRepositoryTest {
    private class FakeStore(var cache: HoroscopoDoc? = null, var server: HoroscopoDoc? = null, var serverFails: Boolean = false, var cacheFails: Boolean = false) : HoroscopoDocStore {
        var serverCalls = 0
        override suspend fun cache(id: String): HoroscopoDoc? { if (cacheFails) error("no hay caché"); return cache }
        override suspend fun server(id: String): HoroscopoDoc? { serverCalls++; if (serverFails) error("sin red"); return server }
    }
    private fun doc(fecha: String, text: String = "t") = HoroscopoDoc("aries", fecha, text)
    private fun repo(s: FakeStore) = HoroscopoRepository(s, today = { "2026-10-04" })

    @Test fun todayCacheHitDoesNotTouchTheServer() = runBlocking {
        val s = FakeStore(cache = doc("2026-10-04", "cache"), server = doc("2026-10-04", "server"))
        assertEquals("cache", repo(s).obtenerHoroscopoDiario("aries")!!.prediccion)
        assertEquals(0, s.serverCalls)
    }

    @Test fun staleCacheGoesToServer() = runBlocking {
        val s = FakeStore(cache = doc("2026-10-03", "ayer"), server = doc("2026-10-04", "hoy"))
        assertEquals("hoy", repo(s).obtenerHoroscopoDiario("aries")!!.prediccion)
        assertEquals(1, s.serverCalls)
    }

    @Test fun emptyCacheGoesToServer() = runBlocking {
        val s = FakeStore(server = doc("2026-10-04", "hoy"), cacheFails = true) // primera apertura: la lectura de caché falla
        assertEquals("hoy", repo(s).obtenerHoroscopoDiario("aries")!!.prediccion)
    }

    @Test fun offlineReturnsLastSavedInsteadOfNothing() = runBlocking {
        val s = FakeStore(cache = doc("2026-10-02", "antiguo"), serverFails = true)
        assertEquals("antiguo", repo(s).obtenerHoroscopoDiario("aries")!!.prediccion)
    }

    @Test fun serverOlderThanCacheKeepsTheNewest() = runBlocking {
        val s = FakeStore(cache = doc("2026-10-03", "cache"), server = doc("2026-10-01", "viejo"))
        assertEquals("cache", repo(s).obtenerHoroscopoDiario("aries")!!.prediccion)
    }

    @Test fun nothingAnywhereIsNull() = runBlocking {
        assertNull(repo(FakeStore(serverFails = true, cacheFails = true)).obtenerHoroscopoDiario("aries"))
        assertNull(repo(FakeStore()).obtenerHoroscopoDiario("aries"))
    }

    @Test fun docWithoutDateIsIgnored() = runBlocking {
        assertNull(repo(FakeStore(server = HoroscopoDoc(signo = "aries", prediccion = "x"))).obtenerHoroscopoDiario("aries"))
    }
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class HoroscopeSectionTest {
    private val ctx: Context get() = ApplicationProvider.getApplicationContext()
    private val original = HoroscopeSection.sourceProvider

    @Before fun setUp() { ctx.getSharedPreferences("agenda", Context.MODE_PRIVATE).edit().clear().commit() }
    @After fun tearDown() { HoroscopeSection.sourceProvider = original }

    @Test fun withoutBirthDateAsksForIt() = runBlocking {
        FakeHoroscope.install()
        val d = HoroscopeSection.build(ctx)
        assertTrue(d.ok); assertFalse(d.notify); assertNull(d.extra); assertTrue(d.body.contains("fecha de nacimiento"))
    }

    @Test fun withoutFirebaseItIsSilentNotAFailure() = runBlocking {
        Prefs(ctx).birthDate = "1984-04-05"
        HoroscopeSection.sourceProvider = { null }
        val d = HoroscopeSection.build(ctx)
        assertTrue(d.ok); assertFalse("no debe avisar cada día de que falta configurar", d.notify); assertNull(d.extra)
    }

    @Test fun realDocIsShownWithSourceFields() = runBlocking {
        Prefs(ctx).birthDate = "1984-04-05" // Aries
        FakeHoroscope.install()
        val d = HoroscopeSection.build(ctx)
        assertTrue(d.ok); assertTrue(d.notify)
        assertTrue(d.title.contains("Aries"))
        val h = HoroscopeData.fromJson(d.extra)!!
        assertEquals(Sign.ARIES, h.sign); assertFalse(h.stale)
        assertEquals("Optimista", h.mood); assertEquals("17", h.luckyNumber); assertEquals("Libra", h.compatible)
        assertEquals(FakeHoroscope.doc.prediccion.trim(), h.text)
        assertTrue(d.body.contains("Número de la suerte: 17") && d.body.contains("Fuente: Aztro"))
        assertTrue(d.preview.first().startsWith("🔮 Hoy es un buen día"))
        assertTrue(d.preview[1].contains("🍀 17"))
    }

    @Test fun asksTheRepositoryForTheSignOfTheUser() = runBlocking {
        Prefs(ctx).birthDate = "1990-08-01" // Leo
        var asked: String? = null
        HoroscopeSection.sourceProvider = { object : HoroscopeSource { override suspend fun obtenerHoroscopoDiario(signoId: String): HoroscopoDoc? { asked = signoId; return FakeHoroscope.doc.copy(signo = signoId) } } }
        HoroscopeSection.build(ctx)
        assertEquals("leo", asked)
    }

    @Test fun oldDocIsMarkedStale() = runBlocking {
        Prefs(ctx).birthDate = "1984-04-05"
        FakeHoroscope.install(FakeHoroscope.doc.copy(fecha = LocalDate.now().minusDays(2).toString()))
        val d = HoroscopeSection.build(ctx)
        assertTrue(d.ok); assertTrue(HoroscopeData.fromJson(d.extra)!!.stale); assertTrue(d.body.contains("desactualizado"))
    }

    @Test fun englishTextIsFlaggedAndNoServerDataIsAFailure() = runBlocking {
        Prefs(ctx).birthDate = "1984-04-05"
        FakeHoroscope.install(FakeHoroscope.doc.copy(idioma = "en"))
        assertEquals("en", HoroscopeData.fromJson(HoroscopeSection.build(ctx).extra)!!.lang)
        FakeHoroscope.install(null)
        val d = HoroscopeSection.build(ctx)
        assertFalse(d.ok); assertTrue(d.notify); assertNull(d.extra)
        FakeHoroscope.install(FakeHoroscope.doc.copy(prediccion = "  "))
        assertFalse(HoroscopeSection.build(ctx).ok)
    }

    @Test fun dataRoundTripsThroughJson() {
        val h = HoroscopeData.from(Sign.LEO, FakeHoroscope.doc.copy(signo = "leo"))
        assertEquals(h, HoroscopeData.fromJson(h.toJson()))
        assertNull(HoroscopeData.fromJson("basura")); assertNull(HoroscopeData.fromJson(null))
    }
}
