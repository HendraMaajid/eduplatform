package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"backend/internal/model"
	"backend/internal/service"
	"backend/pkg/database"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

const confirmationValue = "java-dasar"

type moduleSeed struct {
	Title       string
	Description string
	Duration    string
	Content     string
}

type quizSeed struct {
	Title       string
	Description string
	Questions   []questionSeed
}

type questionSeed struct {
	Text          string
	Options       []string
	CorrectAnswer string
}

type seedResult struct {
	CourseID    uuid.UUID
	CourseName  string
	Teacher     string
	Modules     int
	Quizzes     int
	Questions   int
	Assignments int
}

func main() {
	if os.Getenv("RESET_COURSES_CONFIRM") != confirmationValue {
		log.Fatalf("refusing to reset courses: set RESET_COURSES_CONFIRM=%s", confirmationValue)
	}
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		log.Fatalf("load environment: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	database.InitDB()
	result, err := resetToJavaCourse(ctx, database.DB)
	if err != nil {
		log.Fatalf("seed Java course: %v", err)
	}

	log.Printf(
		"Java course ready: id=%s title=%q teacher=%q modules=%d quizzes=%d questions=%d assignments=%d",
		result.CourseID,
		result.CourseName,
		result.Teacher,
		result.Modules,
		result.Quizzes,
		result.Questions,
		result.Assignments,
	)
}

func resetToJavaCourse(ctx context.Context, db *gorm.DB) (seedResult, error) {
	result := seedResult{}
	err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := deleteExistingCourseData(tx); err != nil {
			return err
		}

		var teacher model.User
		if err := tx.
			Where("deleted_at IS NULL AND role IN ?", []string{"super_admin", "admin", "teacher"}).
			Order("CASE role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, created_at").
			First(&teacher).Error; err != nil {
			return fmt.Errorf("find course teacher: %w", err)
		}

		course := model.Course{
			ID:               uuid.New(),
			Title:            "Java Dasar: Fondasi Pemrograman untuk Pemula",
			Slug:             "java-dasar",
			Description:      `<h2>Belajar Java dari nol dengan alur yang terarah</h2><p>Course ini membantu pemula memahami cara berpikir seorang programmer menggunakan Java. Setiap modul berisi tujuan belajar, penjelasan konsep, contoh kode, latihan kecil, dan checklist sebelum lanjut.</p><p>Di akhir course kamu akan membangun aplikasi kasir berbasis terminal dengan percabangan, perulangan, method, array, dan object-oriented programming dasar.</p>`,
			ShortDescription: "Belajar Java dari nol melalui latihan bertahap hingga membuat aplikasi kasir sederhana.",
			Thumbnail:        "/uploads/java-dasar-thumbnail.svg",
			Category:         "Pemrograman",
			Level:            "beginner",
			Status:           "published",
			TeacherID:        teacher.ID,
			Duration:         "8 Minggu",
			Rating:           0,
			TotalReviews:     0,
		}
		if err := tx.Create(&course).Error; err != nil {
			return fmt.Errorf("create Java course: %w", err)
		}

		modules := javaModules(course.ID)
		if err := tx.Create(&modules).Error; err != nil {
			return fmt.Errorf("create Java modules: %w", err)
		}
		for i := range modules {
			plainText := service.StripHTML(modules[i].Title + " " + modules[i].Description + " " + modules[i].Content)
			embedding := model.ModuleEmbedding{
				ModuleID:  modules[i].ID,
				CourseID:  course.ID,
				Content:   plainText,
				Embedding: service.GenerateEmbedding(plainText),
			}
			if err := tx.Create(&embedding).Error; err != nil {
				return fmt.Errorf("create embedding for module %q: %w", modules[i].Title, err)
			}
		}

		quizzes, questionCount, err := createJavaQuizzes(tx, course.ID)
		if err != nil {
			return err
		}

		assignment := model.Assignment{
			CourseID:     course.ID,
			Title:        "Proyek Akhir: Aplikasi Kasir Mini",
			Description:  "Gabungkan seluruh konsep course dalam satu aplikasi Java berbasis terminal.",
			Instructions: `<h2>Target proyek</h2><p>Buat aplikasi kasir yang dapat menerima beberapa produk, menghitung subtotal, diskon, pembayaran, dan kembalian.</p><h3>Kriteria wajib</h3><ul><li>Gunakan class <code>Produk</code> dengan field nama dan harga.</li><li>Simpan daftar produk belanja dalam array.</li><li>Pisahkan perhitungan subtotal, diskon, dan cetak struk ke method.</li><li>Validasi input agar jumlah barang dan pembayaran tidak bernilai negatif.</li><li>Tampilkan struk yang rapi serta mudah dibaca.</li></ul><h3>Yang dikumpulkan</h3><p>Kode sumber <code>.java</code>, tangkapan layar hasil program, dan catatan singkat mengenai keputusan programmu.</p>`,
			Deadline:     time.Now().AddDate(0, 0, 60),
			MaxScore:     100,
			IsPublished:  true,
		}
		if err := tx.Create(&assignment).Error; err != nil {
			return fmt.Errorf("create Java assignment: %w", err)
		}

		result = seedResult{
			CourseID:    course.ID,
			CourseName:  course.Title,
			Teacher:     teacher.Name,
			Modules:     len(modules),
			Quizzes:     len(quizzes),
			Questions:   questionCount,
			Assignments: 1,
		}
		return nil
	})
	if err != nil {
		return seedResult{}, err
	}
	return result, nil
}

func deleteExistingCourseData(tx *gorm.DB) error {
	statements := []string{
		"DELETE FROM quiz_answers",
		"DELETE FROM quiz_attempts",
		"DELETE FROM questions",
		"DELETE FROM quizzes",
		"DELETE FROM submissions",
		"DELETE FROM assignments",
		"DELETE FROM module_embeddings",
		"DELETE FROM attachments",
		"DELETE FROM learning_progresses",
		"DELETE FROM certificates",
		"DELETE FROM ratings",
		"DELETE FROM modules",
		"DELETE FROM courses",
	}
	for _, statement := range statements {
		if err := tx.Exec(statement).Error; err != nil {
			return fmt.Errorf("execute %q: %w", statement, err)
		}
	}
	if err := tx.Exec("DELETE FROM notifications WHERE link LIKE ?", "%/courses/%").Error; err != nil {
		return fmt.Errorf("delete stale course notifications: %w", err)
	}
	return nil
}

func javaModules(courseID uuid.UUID) []model.Module {
	seeds := []moduleSeed{
		{
			Title:       "Persiapan dan Program Java Pertama",
			Description: "Siapkan JDK, pahami struktur program, lalu jalankan Hello World pertama.",
			Duration:    "1 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membedakan JDK, JRE, dan JVM.</li><li>Memeriksa instalasi Java dari terminal.</li><li>Menulis, mengompilasi, dan menjalankan program pertama.</li></ul><h2>Gambaran sederhana</h2><p>Kode Java ditulis dalam file <code>.java</code>. Compiler <code>javac</code> mengubahnya menjadi bytecode <code>.class</code>, lalu JVM menjalankan bytecode tersebut. Inilah alasan program Java dapat berjalan di banyak sistem operasi.</p><h2>Program pertama</h2><pre><code>public class HaloJava {
    public static void main(String[] args) {
        System.out.println("Halo, Java!");
    }
}</code></pre><p>Simpan sebagai <code>HaloJava.java</code>, jalankan <code>javac HaloJava.java</code>, kemudian <code>java HaloJava</code>.</p><h2>Latihan</h2><ol><li>Ganti pesan menjadi nama dan alasanmu belajar Java.</li><li>Tambahkan dua baris output baru.</li><li>Sengaja hapus satu titik koma, baca pesan error, lalu perbaiki.</li></ol><blockquote>Jangan takut pada error. Pesan error adalah petunjuk lokasi dan jenis masalah.</blockquote><h2>Checklist</h2><ul><li>Perintah <code>java -version</code> berhasil.</li><li>Nama file sama dengan nama class.</li><li>Program berhasil dikompilasi dan dijalankan.</li></ul>`,
		},
		{
			Title:       "Variabel, Tipe Data, dan Operator",
			Description: "Kelola data program dengan tipe yang tepat dan lakukan perhitungan dasar.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Mendeklarasikan variabel dengan nama yang jelas.</li><li>Memilih tipe data primitif dan <code>String</code>.</li><li>Menggunakan operator aritmatika, perbandingan, dan logika.</li></ul><h2>Variabel dan tipe data</h2><pre><code>String nama = "Aisyah";
int usia = 19;
double nilai = 87.5;
boolean lulus = nilai &gt;= 75;

System.out.println(nama + " lulus: " + lulus);</code></pre><p>Gunakan <code>int</code> untuk bilangan bulat, <code>double</code> untuk pecahan, <code>boolean</code> untuk kondisi benar/salah, dan <code>String</code> untuk teks.</p><h2>Konversi dan perhitungan</h2><pre><code>int harga = 15000;
int jumlah = 3;
int subtotal = harga * jumlah;
double pajak = subtotal * 0.11;
double total = subtotal + pajak;</code></pre><h2>Latihan bertahap</h2><ol><li>Buat variabel biodata dan tampilkan dalam satu kalimat.</li><li>Hitung luas serta keliling persegi panjang.</li><li>Hitung total belanja setelah diskon 10%.</li></ol><h2>Kesalahan umum</h2><ul><li>Menggunakan <code>int</code> untuk hasil pembagian yang membutuhkan pecahan.</li><li>Membandingkan teks dengan <code>==</code>; gunakan <code>equals</code>.</li><li>Nama variabel tidak menjelaskan isinya.</li></ul>`,
		},
		{
			Title:       "Input Pengguna dan Percabangan",
			Description: "Buat program interaktif dan tentukan alur dengan if, else, serta switch.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membaca input menggunakan <code>Scanner</code>.</li><li>Menyusun kondisi dengan <code>if</code>, <code>else if</code>, dan <code>else</code>.</li><li>Memakai <code>switch</code> untuk pilihan yang terstruktur.</li></ul><h2>Membaca input</h2><pre><code>import java.util.Scanner;

Scanner input = new Scanner(System.in);
System.out.print("Masukkan nilai: ");
int nilai = input.nextInt();

if (nilai &gt;= 75) {
    System.out.println("Lulus");
} else {
    System.out.println("Belajar lagi");
}
input.close();</code></pre><h2>Menyusun kondisi yang mudah dibaca</h2><p>Mulai dari aturan paling spesifik. Gabungkan kondisi dengan <code>&amp;&amp;</code> untuk “dan”, <code>||</code> untuk “atau”, serta <code>!</code> untuk negasi.</p><h2>Latihan</h2><ol><li>Buat konversi nilai angka menjadi A–E.</li><li>Buat pengecekan tahun kabisat.</li><li>Buat menu sederhana: 1 untuk lihat saldo, 2 untuk setor, dan 3 untuk keluar.</li></ol><h2>Checklist</h2><ul><li>Setiap cabang kondisi dapat diuji.</li><li>Program menangani nilai batas seperti 74 dan 75.</li><li>Pesan untuk input yang tidak valid mudah dipahami.</li></ul>`,
		},
		{
			Title:       "Perulangan dan Pola Berpikir Iteratif",
			Description: "Ulangi pekerjaan secara aman menggunakan for, while, dan kontrol loop.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Memilih <code>for</code> atau <code>while</code> sesuai kebutuhan.</li><li>Menghindari infinite loop.</li><li>Menggunakan accumulator untuk menghitung total.</li></ul><h2>Contoh perulangan</h2><pre><code>int total = 0;
for (int angka = 1; angka &lt;= 5; angka++) {
    total += angka;
}
System.out.println("Total: " + total);</code></pre><p><code>for</code> cocok saat jumlah pengulangan diketahui. <code>while</code> cocok saat pengulangan bergantung pada kondisi, misalnya meminta input sampai valid.</p><h2>Latihan</h2><ol><li>Tampilkan bilangan genap dari 2 sampai 100.</li><li>Buat tabel perkalian dari angka pilihan pengguna.</li><li>Hitung rata-rata sejumlah nilai sampai pengguna mengetik angka sentinel.</li><li>Buat pola segitiga bintang dengan nested loop.</li></ol><h2>Debugging loop</h2><ul><li>Periksa nilai awal.</li><li>Pastikan kondisi suatu saat menjadi salah.</li><li>Pastikan variabel kontrol berubah pada setiap iterasi.</li></ul>`,
		},
		{
			Title:       "Method, Parameter, Return Value, dan Scope",
			Description: "Pecah program menjadi bagian kecil yang dapat dipahami dan digunakan ulang.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membuat method dengan tanggung jawab tunggal.</li><li>Mengirim data melalui parameter.</li><li>Mengembalikan hasil dengan <code>return</code>.</li><li>Memahami scope variabel.</li></ul><h2>Contoh method</h2><pre><code>static int hitungSubtotal(int harga, int jumlah) {
    return harga * jumlah;
}

static double hitungDiskon(int subtotal, double persen) {
    return subtotal * persen / 100;
}</code></pre><p>Nama method sebaiknya berupa kata kerja. Method yang baik melakukan satu hal dan mudah diuji dengan beberapa input.</p><h2>Latihan refactor</h2><ol><li>Pindahkan perhitungan luas ke method.</li><li>Buat method <code>isLulus</code> yang mengembalikan boolean.</li><li>Pecah program kalkulator menjadi method tambah, kurang, kali, dan bagi.</li></ol><h2>Checklist</h2><ul><li>Parameter hanya berisi data yang dibutuhkan.</li><li>Tipe return sesuai dengan hasil.</li><li>Tidak ada duplikasi logika yang bisa dipindah ke method.</li></ul>`,
		},
		{
			Title:       "Array, String, dan Pengolahan Kumpulan Data",
			Description: "Simpan banyak nilai, telusuri isinya, dan olah teks dengan aman.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membuat dan mengakses array.</li><li>Menelusuri array dengan loop.</li><li>Menggunakan method penting pada <code>String</code>.</li><li>Mencegah akses index di luar batas.</li></ul><h2>Array nilai</h2><pre><code>int[] nilai = {80, 92, 76, 88};
int total = 0;

for (int item : nilai) {
    total += item;
}

double rataRata = (double) total / nilai.length;</code></pre><h2>Mengolah String</h2><pre><code>String nama = "  Budi Santoso  ";
String bersih = nama.trim().toLowerCase();
boolean mengandungBudi = bersih.contains("budi");</code></pre><h2>Latihan</h2><ol><li>Cari nilai tertinggi dan terendah dalam array.</li><li>Hitung berapa nilai yang mencapai KKM.</li><li>Balik urutan sebuah kata tanpa library tambahan.</li><li>Buat pencarian nama yang tidak sensitif huruf besar/kecil.</li></ol>`,
		},
		{
			Title:       "OOP Dasar: Class, Object, dan Encapsulation",
			Description: "Modelkan data dan perilaku menggunakan class serta object yang rapi.",
			Duration:    "3 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membedakan class dan object.</li><li>Membuat constructor.</li><li>Melindungi state menggunakan encapsulation.</li><li>Menempatkan perilaku pada class yang tepat.</li></ul><h2>Class Produk</h2><pre><code>public class Produk {
    private String nama;
    private int harga;

    public Produk(String nama, int harga) {
        this.nama = nama;
        setHarga(harga);
    }

    public int getHarga() {
        return harga;
    }

    public void setHarga(int harga) {
        if (harga &lt; 0) {
            throw new IllegalArgumentException("Harga tidak boleh negatif");
        }
        this.harga = harga;
    }
}</code></pre><p>Class adalah cetak biru, sedangkan object adalah wujud yang dibuat dari class. Field dibuat <code>private</code> agar perubahan data melewati aturan yang kita tentukan.</p><h2>Latihan</h2><ol><li>Buat class <code>Mahasiswa</code> dengan nama dan nilai.</li><li>Tambahkan method untuk menentukan status lulus.</li><li>Buat tiga object dan tampilkan ringkasannya.</li></ol><h2>Checklist</h2><ul><li>Constructor menghasilkan object yang valid.</li><li>Field penting tidak dapat diubah sembarangan.</li><li>Method berada pada class yang bertanggung jawab.</li></ul>`,
		},
		{
			Title:       "Proyek Praktik: Aplikasi Kasir Berbasis Terminal",
			Description: "Gabungkan seluruh fondasi Java dalam satu proyek yang dekat dengan kebutuhan nyata.",
			Duration:    "3 Jam",
			Content: `<h2>Tujuan proyek</h2><p>Kamu akan membuat aplikasi kasir mini. Kerjakan bertahap dan jalankan program setiap kali satu fitur selesai.</p><h2>Tahap 1 — Model data</h2><p>Buat class <code>Produk</code> dengan nama dan harga. Siapkan beberapa produk sebagai katalog awal.</p><h2>Tahap 2 — Input belanja</h2><p>Gunakan <code>Scanner</code> untuk memilih produk dan memasukkan jumlah. Simpan item yang dibeli ke dalam array.</p><h2>Tahap 3 — Perhitungan</h2><p>Buat method untuk menghitung subtotal, diskon, total pembayaran, dan kembalian. Validasi agar jumlah serta uang pembayaran tidak negatif.</p><h2>Tahap 4 — Struk</h2><pre><code>=== TOKO BELAJAR JAVA ===
Kopi       2 x 15000 = 30000
Roti       1 x 12000 = 12000
Subtotal              = 42000
Diskon                =  4200
Total                 = 37800</code></pre><h2>Strategi pengerjaan</h2><ol><li>Tulis pseudocode sebelum menulis Java.</li><li>Buat satu fitur kecil.</li><li>Kompilasi dan uji.</li><li>Perbaiki nama variabel dan duplikasi.</li><li>Lanjutkan ke fitur berikutnya.</li></ol><blockquote>Program yang selesai dan mudah dibaca lebih berharga daripada program besar yang sulit dipahami.</blockquote><h2>Refleksi</h2><ul><li>Bagian mana yang paling sering menghasilkan error?</li><li>Method mana yang paling mudah diuji?</li><li>Apa yang akan kamu rapikan jika punya waktu tambahan?</li></ul>`,
		},
	}

	modules := make([]model.Module, 0, len(seeds))
	for index, seed := range seeds {
		modules = append(modules, model.Module{
			ID:          uuid.New(),
			CourseID:    courseID,
			Title:       seed.Title,
			Description: seed.Description,
			Content:     seed.Content,
			Order:       index + 1,
			Duration:    seed.Duration,
			IsPublished: true,
		})
	}
	return modules
}

func createJavaQuizzes(tx *gorm.DB, courseID uuid.UUID) ([]model.Quiz, int, error) {
	seeds := []quizSeed{
		{
			Title:       "Kuis Fondasi Java",
			Description: "Periksa pemahaman variabel, operator, percabangan, perulangan, dan method.",
			Questions: []questionSeed{
				{Text: "Komponen apa yang menjalankan bytecode Java?", Options: []string{"JVM", "JDK", "javac", "IDE"}, CorrectAnswer: "JVM"},
				{Text: "Tipe data yang tepat untuk kondisi benar atau salah adalah...", Options: []string{"String", "boolean", "double", "char"}, CorrectAnswer: "boolean"},
				{Text: "Operator logika AND di Java ditulis sebagai...", Options: []string{"&", "&&", "and", "||"}, CorrectAnswer: "&&"},
				{Text: "Loop yang paling sesuai ketika jumlah perulangan telah diketahui adalah...", Options: []string{"for", "while", "switch", "if"}, CorrectAnswer: "for"},
				{Text: "Kata kunci untuk mengirim hasil keluar dari method adalah...", Options: []string{"break", "continue", "return", "static"}, CorrectAnswer: "return"},
			},
		},
		{
			Title:       "Kuis Array dan OOP Dasar",
			Description: "Pastikan kamu siap mengerjakan proyek akhir dengan array, String, class, dan object.",
			Questions: []questionSeed{
				{Text: "Index pertama sebuah array Java adalah...", Options: []string{"0", "1", "-1", "Bergantung ukuran"}, CorrectAnswer: "0"},
				{Text: "Properti untuk mengetahui panjang array adalah...", Options: []string{"size()", "length", "length()", "count"}, CorrectAnswer: "length"},
				{Text: "Method yang tepat untuk membandingkan isi dua String adalah...", Options: []string{"==", "equals", "compare", "same"}, CorrectAnswer: "equals"},
				{Text: "Cetak biru untuk membuat object disebut...", Options: []string{"method", "class", "package", "variable"}, CorrectAnswer: "class"},
				{Text: "Modifier yang umum digunakan untuk melindungi field dari akses langsung adalah...", Options: []string{"public", "static", "private", "final"}, CorrectAnswer: "private"},
			},
		},
	}

	quizzes := make([]model.Quiz, 0, len(seeds))
	questionCount := 0
	for _, seed := range seeds {
		quiz := model.Quiz{
			ID:           uuid.New(),
			CourseID:     courseID,
			Title:        seed.Title,
			Description:  seed.Description,
			PassingScore: 70,
			TimeLimit:    15,
			IsPublished:  true,
		}
		if err := tx.Create(&quiz).Error; err != nil {
			return nil, 0, fmt.Errorf("create quiz %q: %w", seed.Title, err)
		}
		for index, questionSeed := range seed.Questions {
			question := model.Question{
				ID:            uuid.New(),
				QuizID:        quiz.ID,
				Type:          "multiple_choice",
				Text:          questionSeed.Text,
				Options:       model.StringArray(questionSeed.Options),
				CorrectAnswer: questionSeed.CorrectAnswer,
				Points:        20,
				Order:         index + 1,
			}
			if err := tx.Create(&question).Error; err != nil {
				return nil, 0, fmt.Errorf("create question for quiz %q: %w", seed.Title, err)
			}
			questionCount++
		}
		quizzes = append(quizzes, quiz)
	}
	return quizzes, questionCount, nil
}
