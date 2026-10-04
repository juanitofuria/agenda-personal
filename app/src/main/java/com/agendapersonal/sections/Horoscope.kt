package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.util.Random

enum class Sign(val label: String, val symbol: String, val element: String) {
    ARIES("Aries", "♈", "fuego"), TAURUS("Tauro", "♉", "tierra"), GEMINI("Géminis", "♊", "aire"),
    CANCER("Cáncer", "♋", "agua"), LEO("Leo", "♌", "fuego"), VIRGO("Virgo", "♍", "tierra"),
    LIBRA("Libra", "♎", "aire"), SCORPIO("Escorpio", "♏", "agua"), SAGITTARIUS("Sagitario", "♐", "fuego"),
    CAPRICORN("Capricornio", "♑", "tierra"), AQUARIUS("Acuario", "♒", "aire"), PISCES("Piscis", "♓", "agua");

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

data class HoroscopeItem(val category: String, val emoji: String, val stars: Int, val text: String)

data class HoroscopeData(
    val sign: Sign, val date: String, val items: List<HoroscopeItem>,
    val luckyNumber: Int, val luckyColor: String, val compatible: Sign, val advice: String,
) {
    fun toJson(): String = JSONObject()
        .put("sign", sign.name).put("date", date).put("lucky", luckyNumber).put("color", luckyColor)
        .put("compatible", compatible.name).put("advice", advice)
        .put("items", JSONArray(items.map { JSONObject().put("c", it.category).put("e", it.emoji).put("s", it.stars).put("t", it.text) }))
        .toString()

    companion object {
        fun fromJson(raw: String?): HoroscopeData? = runCatching {
            val j = JSONObject(raw ?: return null)
            val arr = j.getJSONArray("items")
            HoroscopeData(
                Sign.valueOf(j.getString("sign")), j.getString("date"),
                (0 until arr.length()).map { val o = arr.getJSONObject(it); HoroscopeItem(o.getString("c"), o.getString("e"), o.getInt("s"), o.getString("t")) },
                j.getInt("lucky"), j.getString("color"), Sign.valueOf(j.getString("compatible")), j.getString("advice"),
            )
        }.getOrNull()
    }
}

/**
 * Horóscopo de entretenimiento generado en el propio móvil: no consulta ningún servicio.
 * Es determinista (mismo signo + mismo día = mismo horóscopo) y cambia cada día.
 */
object HoroscopeEngine {
    private val categories = listOf("Salud" to "💪", "Dinero" to "💰", "Trabajo" to "💼", "Amor" to "❤️")

    // 4 categorías × 3 niveles (bajo, medio, alto) × 5 frases.
    private val pool: Map<String, List<List<String>>> = mapOf(
        "Salud" to listOf(
            listOf("Tu cuerpo pide calma: baja el ritmo y duerme unas horas más.", "Cuida la espalda y evita esfuerzos innecesarios hoy.", "Notarás cansancio; una caminata suave te ayudará más que el sofá.", "Hidrátate y no te saltes comidas, la energía andará justa.", "Escucha las señales de estrés y date un respiro a media tarde."),
            listOf("Día estable: mantén tus rutinas y todo irá bien.", "Un poco de estiramiento y aire libre te sentarán de maravilla.", "Energía correcta; evita los excesos y llegarás en forma al final del día.", "Buen momento para retomar un hábito saludable pendiente.", "Tu ánimo acompaña, aunque conviene no apurar el descanso."),
            listOf("Te sentirás con vitalidad de sobra: aprovéchala para moverte.", "Excelente día para el deporte o una buena caminata.", "Tu cuerpo responde: ideal para empezar esa dieta o rutina.", "Energía alta y buen humor; contagiarás a quien tengas cerca.", "Descansarás bien y despertarás con ganas de comerte el mundo."),
        ),
        "Dinero" to listOf(
            listOf("Evita compras impulsivas: hoy el bolsillo sufre si te dejas llevar.", "No es el día para préstamos ni inversiones arriesgadas.", "Revisa tus gastos fijos; encontrarás algo que recortar.", "Un imprevisto menor puede alterar tu presupuesto: ten margen.", "Mejor esperar antes de cerrar un trato económico importante."),
            listOf("Finanzas tranquilas: pequeñas decisiones sensatas suman.", "Buen día para ordenar cuentas y planificar la semana.", "Podría llegar un pequeño ingreso o un reembolso pendiente.", "Compara precios antes de comprar y ahorrarás sin esfuerzo.", "Equilibrio entre gasto y ahorro: sigue con tu plan."),
            listOf("Se abren oportunidades de ganancia: mantén los ojos abiertos.", "Tu olfato para los números está afinado; confía en él.", "Buen momento para negociar o pedir lo que te corresponde.", "Un esfuerzo reciente empieza a dar fruto económico.", "Día favorable para cerrar acuerdos y asegurar tus ahorros."),
        ),
        "Trabajo" to listOf(
            listOf("Posibles tensiones con compañeros: respira antes de responder.", "La carga se acumula; prioriza y no intentes abarcarlo todo.", "Un malentendido puede retrasarte; aclara las cosas por escrito.", "Día lento: evita decisiones importantes y revisa dos veces tu trabajo.", "Cuidado con las distracciones, te robarán tiempo valioso."),
            listOf("Jornada productiva si te organizas con calma.", "Buen día para colaborar y escuchar ideas ajenas.", "Avanzarás en tareas pendientes sin grandes sobresaltos.", "Tu constancia será valorada, aunque hoy no lo parezca.", "Ritmo estable: ideal para terminar lo que dejaste a medias."),
            listOf("Brillas en lo profesional: tus ideas serán bien recibidas.", "Un reconocimiento o buena noticia laboral está cerca.", "Tienes el impulso perfecto para proponer ese proyecto.", "Tu liderazgo natural sale a flote; aprovéchalo.", "Todo fluye en el trabajo: avanza con decisión."),
        ),
        "Amor" to listOf(
            listOf("Cuidado con las palabras: un comentario puede malinterpretarse.", "Necesitas espacio; díselo con cariño a quien te importa.", "Día para escuchar más y reprochar menos.", "Si estás solo, no fuerces encuentros: déjate llevar sin prisa.", "Posible distancia emocional; un gesto sincero la acorta."),
            listOf("Ambiente cálido y sereno con tu entorno cercano.", "Buen día para una conversación pendiente, con tacto.", "Un plan sencillo en pareja o con amigos te hará bien.", "Si estás solo, una charla casual puede sorprenderte.", "Afecto estable: pequeños detalles marcan la diferencia."),
            listOf("El romance sopla a tu favor: atrévete a dar el primer paso.", "Magnetismo al máximo: te será fácil conectar con los demás.", "Día ideal para una cita o para renovar la ilusión en pareja.", "Recibirás muestras de cariño inesperadas.", "Tu sinceridad enamora; di lo que sientes."),
        ),
    )

    private val advice = mapOf(
        "fuego" to listOf("Canaliza tu energía en una sola meta y llegarás lejos.", "Hoy la iniciativa es tu mejor aliada: da el primer paso.", "Lidera con el ejemplo; no hace falta alzar la voz."),
        "tierra" to listOf("Paso a paso y con los pies en el suelo: así se construye lo duradero.", "Dedica un rato a lo práctico: ordenar es avanzar.", "La paciencia hoy vale más que la prisa."),
        "aire" to listOf("Comparte tus ideas: alguien necesita justo lo que piensas.", "Una conversación inesperada abrirá un camino nuevo.", "Mantén la mente ágil y curiosa; hoy aprenderás algo útil."),
        "agua" to listOf("Confía en tu intuición, rara vez se equivoca.", "Cuida tu mundo emocional: un rato de calma lo cambia todo.", "Hoy la empatía te abrirá puertas que la lógica no alcanza."),
    )

    private val colors = listOf("Azul", "Verde", "Rojo", "Amarillo", "Violeta", "Naranja", "Blanco", "Turquesa", "Rosa", "Dorado")

    fun generate(birth: LocalDate, day: LocalDate): HoroscopeData {
        val sign = Sign.of(birth)
        fun rnd(salt: Int) = Random(sign.ordinal * 1_000_003L + day.toEpochDay() * 7919L + salt * 104_729L)
        val items = categories.mapIndexed { i, (cat, emoji) ->
            val r = rnd(i + 1)
            val stars = listOf(2, 3, 3, 4, 4, 5)[r.nextInt(6)].let { if (r.nextInt(8) == 0) 1 else it }
            val tier = when { stars <= 2 -> 0; stars == 3 -> 1; else -> 2 }
            HoroscopeItem(cat, emoji, stars, pool.getValue(cat)[tier][r.nextInt(5)])
        }
        val r = rnd(9)
        return HoroscopeData(
            sign, day.toString(), items, 1 + r.nextInt(99), colors[r.nextInt(colors.size)],
            Sign.entries[r.nextInt(12)], advice.getValue(sign.element).let { it[r.nextInt(it.size)] },
        )
    }

    fun stars(n: Int) = "★".repeat(n) + "☆".repeat(5 - n)
}

object HoroscopeSection : Section {
    override val id = "horoscope"
    override val title = "Horóscopo"
    override val description = "Salud, dinero, trabajo y amor de tu signo"
    override val defaultHour = 8
    override val defaultMinute = 0
    override val needsNetwork = false
    override val emoji = "🔮"
    override val accent = 0xFFDB2777.toInt()
    override val defaultEnabled = false // se activa al dar la fecha de nacimiento

    override suspend fun build(context: Context): Digest {
        val birth = runCatching { LocalDate.parse(Prefs(context).birthDate) }.getOrNull()
            ?: return Digest(
                "Horóscopo", "Falta tu fecha de nacimiento",
                "Añade tu fecha de nacimiento en Ajustes › Perfil para ver tu horóscopo diario.",
                listOf("🔮 Añade tu fecha de nacimiento en Ajustes › Perfil"),
            )
        val data = HoroscopeEngine.generate(birth, LocalDate.now())
        val body = buildString {
            append("${data.sign.symbol} ${data.sign.label} · ${data.sign.element}\n${data.advice}")
            data.items.forEach { append("\n\n${it.emoji} ${it.category}  ${HoroscopeEngine.stars(it.stars)}\n${it.text}") }
            append("\n\n🍀 Número de la suerte: ${data.luckyNumber} · Color: ${data.luckyColor} · Afinidad: ${data.compatible.label}")
        }
        val preview = data.items.map { "${it.emoji} ${it.category} ${HoroscopeEngine.stars(it.stars)} · ${it.text}" }
        return Digest(
            "Horóscopo · ${data.sign.symbol} ${data.sign.label}", data.advice, body, preview, data.toJson(),
        )
    }
}
