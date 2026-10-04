package com.agendapersonal.notify

import android.graphics.*
import com.agendapersonal.sections.HourPoint
import com.agendapersonal.sections.WeatherIcons
import kotlin.math.roundToInt

/** Gráfica de temperatura por horas como imagen para la notificación (fondo transparente, legible en claro y oscuro). */
object WeatherChartBitmap {
    private const val LINE = 0xFF0EA5E9.toInt()
    private const val MUTED = 0xFF8A93A6.toInt()

    fun render(hours: List<HourPoint>, width: Int = 960, height: Int = 420): Bitmap {
        val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        if (hours.size < 2) return bmp
        val c = Canvas(bmp)
        val d = width / 360f // "dp" virtual
        val padX = 14 * d; val iconH = 30 * d; val tempH = 18 * d; val axisH = 20 * d; val barsH = 30 * d
        val top = iconH + tempH
        val bottom = height - axisH - barsH - 6 * d
        val plotW = width - 2 * padX
        val n = hours.size
        val step = if (n > 12) 3 else 2
        val tMin = hours.minOf { it.temp } - 1
        val tMax = hours.maxOf { it.temp } + 1
        fun x(i: Int) = padX + plotW * i / (n - 1)
        fun y(t: Double) = (bottom - (t - tMin) / (tMax - tMin) * (bottom - top)).toFloat()

        val grid = Paint().apply { color = 0x33808890; strokeWidth = d }
        for (k in 0..2) { val gy = top + (bottom - top) * k / 2; c.drawLine(padX, gy, width - padX, gy, grid) }

        val path = Path().apply {
            moveTo(x(0), y(hours[0].temp))
            for (i in 1 until n) { val mx = (x(i - 1) + x(i)) / 2; cubicTo(mx, y(hours[i - 1].temp), mx, y(hours[i].temp), x(i), y(hours[i].temp)) }
        }
        val fill = Path(path).apply { lineTo(x(n - 1), bottom); lineTo(x(0), bottom); close() }
        c.drawPath(fill, Paint(Paint.ANTI_ALIAS_FLAG).apply { shader = LinearGradient(0f, top, 0f, bottom, 0x470EA5E9, 0x000EA5E9, Shader.TileMode.CLAMP) })
        c.drawPath(path, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = LINE; style = Paint.Style.STROKE; strokeWidth = 3 * d; strokeCap = Paint.Cap.ROUND })

        val barP = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x8C0EA5E9.toInt() }
        val bw = plotW / n * 0.55f; val base = height - axisH
        hours.forEachIndexed { i, h ->
            if (h.prob < 10) return@forEachIndexed
            val bh = maxOf(barsH * h.prob / 100f, 1.5f * d)
            c.drawRoundRect(RectF(x(i) - bw / 2, base - bh, x(i) + bw / 2, base), 2 * d, 2 * d, barP)
        }

        val dotW = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
        val dotL = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = LINE }
        val emoji = Paint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 18 * d; textAlign = Paint.Align.CENTER }
        val temp = Paint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 11 * d; textAlign = Paint.Align.CENTER; typeface = Typeface.DEFAULT_BOLD; color = 0xFF7C8496.toInt() }
        val hourP = Paint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 10 * d; textAlign = Paint.Align.CENTER; color = MUTED }
        hours.forEachIndexed { i, h ->
            c.drawCircle(x(i), y(h.temp), 4.5f * d, dotW); c.drawCircle(x(i), y(h.temp), 3 * d, dotL)
            if (i % step == 0) {
                c.drawText(WeatherIcons.emoji(h.code), x(i), iconH - 6 * d, emoji)
                c.drawText("${h.temp.roundToInt()}º", x(i), iconH + tempH - 4 * d, temp)
                c.drawText("%02d h".format(h.hour), x(i), height - 5 * d, hourP)
            }
        }
        return bmp
    }
}
