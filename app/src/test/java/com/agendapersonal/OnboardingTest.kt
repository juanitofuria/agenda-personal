package com.agendapersonal

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.agendapersonal.data.AppDb
import com.agendapersonal.data.Prefs
import com.agendapersonal.net.Place
import com.agendapersonal.sections.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.time.LocalDate

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class OnboardingTest {
    private val ctx: Context get() = ApplicationProvider.getApplicationContext()
    private val prefs get() = Prefs(ctx)

    @Before fun setUp() {
        ctx.getSharedPreferences("agenda", Context.MODE_PRIVATE).edit().clear().commit()
        runBlocking { withContext(Dispatchers.IO) { AppDb.get(ctx).clearAllTables() } }
    }

    private fun ids() = SectionRegistry.all.map { it.id }

    @Test fun defaultsBeforeAnyChoice() {
        assertFalse(prefs.onboarded)
        assertEquals(listOf("weather", "news", "agenda", "markets", "horoscope"), ids())
        assertTrue(prefs.isEnabled(WeatherSection)); assertTrue(prefs.isEnabled(MarketsSection))
        assertFalse("el horóscopo no se activa sin fecha de nacimiento", prefs.isEnabled(HoroscopeSection))
    }

    @Test fun skipEntersAppKeepingDefaults() = runBlocking {
        Onboarding.skip(ctx)
        assertTrue(prefs.onboarded)
        assertEquals(listOf("weather", "news", "agenda", "markets", "horoscope"), ids())
        assertTrue(prefs.isEnabled(NewsSection)); assertFalse(prefs.isEnabled(HoroscopeSection))
        assertEquals("Montoro", prefs.placeName) // sigue la ubicación por defecto
    }

    @Test fun skipKeepsWhatWasAlreadyTyped() = runBlocking {
        Onboarding.skip(ctx, OnboardingChoices(name = " Ana ", birth = LocalDate.of(1990, 8, 1)))
        assertEquals("Ana", prefs.userName)
        assertEquals("1990-08-01", prefs.birthDate)
        assertTrue("con fecha de nacimiento el horóscopo se activa", prefs.isEnabled(HoroscopeSection))
        assertTrue(prefs.isEnabled(WeatherSection)) // no se tocó nada más
    }

    @Test fun interestsCreateAndToggleSections() = runBlocking {
        Onboarding.apply(ctx, OnboardingChoices(
            interestsChosen = true, builtIns = setOf("weather", "agenda"),
            topics = setOf("Fútbol", "Música"), extraTopics = listOf("ajedrez", "  ", "pesca deportiva"),
        ))
        assertTrue(prefs.onboarded)
        assertTrue(prefs.isEnabled(WeatherSection)); assertTrue(prefs.isEnabled(AgendaSection))
        assertFalse(prefs.isEnabled(NewsSection)); assertFalse(prefs.isEnabled(MarketsSection)); assertFalse(prefs.isEnabled(HoroscopeSection))
        val custom = SectionRegistry.all.filterIsInstance<TopicSection>()
        assertEquals(setOf("Fútbol", "Música", "Ajedrez", "Pesca deportiva"), custom.map { it.title }.toSet())
        val futbol = custom.first { it.title == "Fútbol" }
        assertEquals("topic_futbol", futbol.id); assertEquals("⚽", futbol.emoji)
        assertTrue(prefs.isEnabled(futbol)) // las personalizadas nacen activadas
        assertSame(futbol.id, SectionRegistry.byId("topic_futbol")!!.id.let { futbol.id })
        assertNotNull(SectionRegistry.byId("topic_ajedrez"))
    }

    @Test fun horoscopeNeedsBirthDateEvenIfChosen() = runBlocking {
        Onboarding.apply(ctx, OnboardingChoices(interestsChosen = true, builtIns = setOf("horoscope")))
        assertFalse(prefs.isEnabled(HoroscopeSection))
        Onboarding.apply(ctx, OnboardingChoices(interestsChosen = true, builtIns = setOf("horoscope"), birth = LocalDate.of(1984, 4, 5)))
        assertTrue(prefs.isEnabled(HoroscopeSection))
    }

    @Test fun placePlansAndAppointmentAreSaved() = runBlocking {
        val place = Place("Lucena", "Andalucía", "Provincia de Córdoba", "España", 37.4, -4.48)
        val at = System.currentTimeMillis() + 3 * 86_400_000L
        Onboarding.apply(ctx, OnboardingChoices(place = place, taskTitle = "Llamar al banco", apptTitle = "Cardiología", apptAt = at))
        assertEquals("Lucena", prefs.placeName); assertEquals("Córdoba", prefs.province); assertEquals("Lucena", prefs.councils)
        assertEquals(37.4, prefs.latitude, 0.001)
        val db = AppDb.get(ctx)
        val tasks = withContext(Dispatchers.IO) { db.tasks().pending() }
        assertEquals(listOf("Llamar al banco"), tasks.map { it.title })
        val appts = withContext(Dispatchers.IO) { db.appointments().upcoming(0) }
        assertEquals(listOf("Cardiología"), appts.map { it.title }); assertEquals(at, appts[0].at)
    }

    @Test fun addingSameTopicTwiceDoesNotDuplicateAndRemoveWorks() {
        CustomTopics.add(prefs, "Ajedrez", "ajedrez"); CustomTopics.add(prefs, "ajedrez", "ajedrez OR Magnus")
        assertEquals(1, CustomTopics.load(prefs).size)
        assertEquals("ajedrez OR Magnus", CustomTopics.load(prefs)[0].query)
        CustomTopics.remove(prefs, "ajedrez")
        assertTrue(SectionRegistry.all.none { it is TopicSection })
    }
}
