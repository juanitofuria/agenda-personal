package com.agendapersonal

import com.agendapersonal.sections.DigestBuilder
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class DigestBuilderTest {
    @Test fun retriesTransientFailures() = runBlocking {
        var calls = 0
        val b = DigestBuilder(retryDelayMs = 0)
        b.part("fuente") { if (++calls < 3) throw java.io.IOException("timeout") else "datos" }
        val d = b.build("t", "s")
        assertEquals(3, calls); assertTrue(d.ok); assertEquals("datos", d.body)
    }

    @Test fun partialFailureStillOkButReported() = runBlocking {
        val b = DigestBuilder(retryDelayMs = 0)
        b.part("buena") { "ok" }
        b.part("mala") { throw java.io.IOException("caída") }
        val d = b.build("t", "s")
        assertTrue(d.ok); assertTrue(d.body.contains("⚠️ mala"))
    }

    @Test fun allFailingIsNotOk() = runBlocking {
        val b = DigestBuilder(retryDelayMs = 0)
        b.part("mala") { throw java.io.IOException("caída") }
        assertFalse(b.build("t", "s").ok)
    }
}
