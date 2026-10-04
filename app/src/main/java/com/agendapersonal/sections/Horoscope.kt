package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Source
import kotlinx.coroutines.tasks.await
import org.json.JSONObject
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

/** Signos con su identificador en Firestore (español sin tildes) y el nombre que usa Aztro (inglés). */
enum class Sign(val label: String, val symbol: String, val element: String, val id: String, val aztro: String) {
    ARIES("Aries", "♈", "fuego", "aries", "aries"), TAURUS("Tauro", "♉", "tierra", "tauro", "taurus"),
    GEMINI("Géminis", "♊", "aire", "geminis", "gemini"), CANCER("Cáncer", "♋", "agua", "cancer", "cancer"),
    LEO("Leo", "♌", "fuego", "leo", "leo"), VIRGO("Virgo", "♍", "tierra", "virgo", "virgo"),
    LIBRA("Libra", "♎", "aire", "libra", "libra"), SCORPIO("Escorpio", "♏", "agua", "escorpio", "scorpio"),
    SAGITTARIUS("Sagitario", "♐", "fuego", "sagitario", "sagittarius"), CAPRICORN("Capricornio", "♑", "tierra", "capricornio", "capricorn"),
    AQUARIUS("Acuario", "♒", "aire", "acuario", "aquarius"), PISCES("Piscis", "♓", "agua", "piscis", "pisces");

    companion object {
        fun of(date: LocalDate): Sign {
            val m = date.monthValue; val d = date.dayOfMonth
            return when {
                (m == 3 && d >= 21) || (m == 4 && d <= 19) -> ARIES
                (m == 4) || (m == 5 && d <= 20) -> TAURUS
                (m == 5) || (m == 6 && d <= 20) -> GEMINI
                (m == 6) || (m == 7 && d <= 22) -> CANCER
                (m == 7) || (m == 8 && d <= 22) -> LEO
                (m == 8) || (m == 9 && d <= 22) -> VIRGO
                (m == 9) || (m == 10 && d <= 22) -> LIBRA
                (m == 10) || (m == 11 && d <= 21) -> SCORPIO
                (m == 11) || (m == 12 && d <= 21) -> SAGITTARIUS
                (m == 12) || (m == 1 && d <= 19) -> CAPRICORN
                (m == 1) || (m == 2 && d <= 18) -> AQUARIUS
                else -> PISCES
            }
        }
    }
}

/**
 * Documento `horoscopos/{signo}` de Cloud Firestore, escrito una vez al día por la Cloud Function
 * (ver carpeta `firebase/`). Todos los campos tienen valor por defecto para que Firestore pueda construirlo.
 */
data class HoroscopoDoc(
    val signo: String = "",
    val fecha: String = "",          // yyyy-MM-dd
    val prediccion: String = "",
    val idioma: String = "es",       // "en" si no se pudo traducir
    val animo: String = "",
    val color: String = "",
    val numeroSuerte: String = "",
    val horaSuerte: String = "",
    val compatibilidad: String = "",
    val fuente: String = "",
)

/** Origen del horóscopo (Firestore en producción, un doble en los tests). */
interface HoroscopeSource {
    suspend fun obtenerHoroscopoDiario(signoId: String): HoroscopoDoc?
}

/** Lectura de un documento: de la caché local de Firestore o del servidor. */
interface HoroscopoDocStore {
    suspend fun cache(id: String): HoroscopoDoc?
    suspend fun server(id: String): HoroscopoDoc?
}

class FirestoreDocStore(private val db: FirebaseFirestore) : HoroscopoDocStore {
    private fun ref(id: String) = db.collection("horoscopos").document(id.lowercase())
    override suspend fun cache(id: String) = ref(id).get(Source.CACHE).await().toObject(HoroscopoDoc::class.java)
    override suspend fun server(id: String) = ref(id).get(Source.SERVER).await().toObject(HoroscopoDoc::class.java)
}

/**
 * Obtiene el horóscopo de un signo. Prioriza la caché local (Firestore la mantiene en disco) y va al servidor si no hay
 * dato de hoy. Sin red devuelve el último guardado, aunque sea de otro día (la sección lo marca como desactualizado).
 */
class HoroscopoRepository(
    private val store: HoroscopoDocStore,
    private val today: () -> String = { LocalDate.now().toString() },
) : HoroscopeSource {

    override suspend fun obtenerHoroscopoDiario(signoId: String): HoroscopoDoc? {
        val cached = runCatching { store.cache(signoId) }.getOrNull()?.takeIf { it.fecha.isNotBlank() }
        if (cached != null && cached.fecha == today()) return cached
        val fresh = runCatching { store.server(signoId) }.getOrNull()?.takeIf { it.fecha.isNotBlank() }
        return listOfNotNull(fresh, cached).maxByOrNull { it.fecha } // ISO: el texto ordena como la fecha
    }

    companion object {
        /** null si Firebase no está configurado (falta google-services.json). */
        fun create(context: Context): HoroscopoRepository? =
            if (FirebaseApp.getApps(context).isEmpty()) null
            else HoroscopoRepository(FirestoreDocStore(FirebaseFirestore.getInstance()))
    }
}

/** Datos del horóscopo ya preparados para mostrar (se guardan junto al resumen). */
data class HoroscopeData(
    val sign: Sign, val date: String, val text: String, val lang: String,
    val mood: String, val color: String, val luckyNumber: String, val luckyTime: String, val compatible: String,
    val stale: Boolean, val source: String,
) {
    fun toJson(): String = JSONObject()
        .put("sign", sign.name).put("date", date).put("text", text).put("lang", lang).put("mood", mood).put("color", color)
        .put("number", luckyNumber).put("time", luckyTime).put("compat", compatible).put("stale", stale).put("source", source)
        .toString()

    companion object {
        fun fromJson(raw: String?): HoroscopeData? = runCatching {
            val j = JSONObject(raw ?: return null)
            HoroscopeData(
                Sign.valueOf(j.getString("sign")), j.getString("date"), j.getString("text"), j.optString("lang", "es"),
                j.optString("mood"), j.optString("color"), j.optString("number"), j.optString("time"), j.optString("compat"),
                j.optBoolean("stale"), j.optString("source"),
            )
        }.getOrNull()

        fun from(sign: Sign, doc: HoroscopoDoc, today: LocalDate = LocalDate.now()) = HoroscopeData(
            sign, doc.fecha, doc.prediccion.trim(), doc.idioma, doc.animo, doc.color, doc.numeroSuerte, doc.horaSuerte,
            doc.compatibilidad, stale = doc.fecha != today.toString(), source = doc.fuente,
        )
    }
}

object HoroscopeSection : Section {
    override val id = "horoscope"
    override val title = "Horóscopo"
    override val description = "Tu horóscopo diario según tu signo"
    override val defaultHour = 8
    override val defaultMinute = 0
    override val emoji = "🔮"
    override val accent = 0xFFDB2777.toInt()
    override val defaultEnabled = false // se activa al dar la fecha de nacimiento

    /** Cómo se obtiene el origen de datos; los tests lo sustituyen. */
    var sourceProvider: (Context) -> HoroscopeSource? = { HoroscopoRepository.create(it) }

    private val dateFmt get() = DateTimeFormatter.ofPattern("d 'de' MMMM", Locale("es", "ES"))

    private fun unavailable(summary: String, body: String, ok: Boolean = true, notify: Boolean = false) =
        Digest("Horóscopo", summary, body, listOf("🔮 $summary"), ok = ok, notify = notify)

    override suspend fun build(context: Context): Digest {
        val birth = runCatching { LocalDate.parse(Prefs(context).birthDate) }.getOrNull()
            ?: return unavailable("Falta tu fecha de nacimiento", "Añade tu fecha de nacimiento en Ajustes › Perfil para ver tu horóscopo diario.")
        val sign = Sign.of(birth)
        val source = sourceProvider(context)
            ?: return unavailable("Horóscopo aún no disponible", "El horóscopo se descarga de un servidor propio (Firebase) que todavía no está conectado a esta versión de la app.")

        val doc = runCatching { source.obtenerHoroscopoDiario(sign.id) }.getOrNull()
        if (doc == null || doc.prediccion.isBlank()) {
            return unavailable("No se pudo obtener el horóscopo", "No se pudo descargar tu horóscopo. Se reintentará más tarde.", ok = false, notify = true)
        }
        val data = HoroscopeData.from(sign, doc)
        val day = runCatching { LocalDate.parse(doc.fecha).format(dateFmt) }.getOrDefault(doc.fecha)
        val body = buildString {
            append("${sign.symbol} ${sign.label} · ")
            append(if (data.stale) "horóscopo del $day (desactualizado)" else "hoy, $day")
            append("\n").append(data.text)
            val extras = listOfNotNull(
                data.mood.takeIf { it.isNotBlank() }?.let { "😊 Ánimo: $it" },
                data.color.takeIf { it.isNotBlank() }?.let { "🎨 Color: $it" },
                data.luckyNumber.takeIf { it.isNotBlank() }?.let { "🍀 Número de la suerte: $it" },
                data.luckyTime.takeIf { it.isNotBlank() }?.let { "⏰ Hora de la suerte: $it" },
                data.compatible.takeIf { it.isNotBlank() }?.let { "💞 Afinidad: $it" },
            )
            if (extras.isNotEmpty()) append("\n\n").append(extras.joinToString("\n"))
            if (data.source.isNotBlank()) append("\n\nFuente: ${data.source}")
        }
        val preview = listOfNotNull(
            "🔮 " + data.text.take(150).let { if (data.text.length > 150) "$it…" else it },
            listOfNotNull(
                data.mood.takeIf { it.isNotBlank() }?.let { "😊 $it" },
                data.luckyNumber.takeIf { it.isNotBlank() }?.let { "🍀 $it" },
                data.color.takeIf { it.isNotBlank() }?.let { "🎨 $it" },
            ).takeIf { it.isNotEmpty() }?.joinToString(" · "),
        )
        val firstSentence = data.text.substringBefore(". ").take(120)
        return Digest("Horóscopo · ${sign.symbol} ${sign.label}", firstSentence, body, preview, data.toJson())
    }
}
