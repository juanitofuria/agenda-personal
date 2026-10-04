package com.agendapersonal.data

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "tasks")
data class Task(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val notes: String = "",
    val done: Boolean = false,
    /** Momento del aviso (epoch ms) o null si no hay aviso. */
    val remindAt: Long? = null,
)

@Entity(tableName = "appointments")
data class Appointment(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val place: String = "",
    /** Fecha y hora de la cita (epoch ms). */
    val at: Long,
    /** Minutos de antelación del aviso. */
    val remindMinutesBefore: Int = 60,
)

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY done, COALESCE(remindAt, 9223372036854775807), id")
    fun observeAll(): Flow<List<Task>>

    @Query("SELECT * FROM tasks WHERE done = 0")
    suspend fun pending(): List<Task>

    @Query("SELECT * FROM tasks WHERE id = :id")
    suspend fun get(id: Long): Task?

    @Insert
    suspend fun insert(task: Task): Long

    @Update
    suspend fun update(task: Task)

    @Delete
    suspend fun delete(task: Task)
}

@Dao
interface AppointmentDao {
    @Query("SELECT * FROM appointments ORDER BY at")
    fun observeAll(): Flow<List<Appointment>>

    @Query("SELECT * FROM appointments WHERE at >= :from")
    suspend fun upcoming(from: Long): List<Appointment>

    @Query("SELECT * FROM appointments WHERE at BETWEEN :from AND :to ORDER BY at")
    suspend fun between(from: Long, to: Long): List<Appointment>

    @Query("SELECT * FROM appointments WHERE id = :id")
    suspend fun get(id: Long): Appointment?

    @Insert
    suspend fun insert(a: Appointment): Long

    @Update
    suspend fun update(a: Appointment)

    @Delete
    suspend fun delete(a: Appointment)
}

@Database(entities = [Task::class, Appointment::class], version = 1, exportSchema = false)
abstract class AppDb : RoomDatabase() {
    abstract fun tasks(): TaskDao
    abstract fun appointments(): AppointmentDao

    companion object {
        @Volatile private var instance: AppDb? = null
        fun get(context: Context): AppDb = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(context.applicationContext, AppDb::class.java, "agenda.db")
                .build().also { instance = it }
        }
    }
}
