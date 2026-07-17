package seed

import "time"

func javaModuleSeeds() []moduleSeed {
	return []moduleSeed{
		{
			Title:       "Ekosistem Java dan Program Pertama",
			Description: "Pahami JDK, JVM, proses kompilasi, dan jalankan program Java pertama dari terminal.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membedakan JDK, JVM, dan bytecode.</li><li>Memeriksa instalasi Java dari terminal.</li><li>Menulis, mengompilasi, dan menjalankan program pertama.</li></ul><h2>Bagaimana Java berjalan?</h2><p>Kode sumber disimpan dalam file <code>.java</code>. Compiler <code>javac</code> mengubahnya menjadi bytecode <code>.class</code>, lalu JVM menjalankan bytecode tersebut. JDK menyediakan compiler dan alat pengembangan, sedangkan JVM menjadi lingkungan eksekusinya.</p><h2>Program pertama</h2><pre><code>public class HaloJava {
    public static void main(String[] args) {
        System.out.println("Halo, Java!");
    }
}</code></pre><p>Simpan sebagai <code>HaloJava.java</code>. Jalankan <code>javac HaloJava.java</code>, lalu <code>java HaloJava</code>. Nama file harus sama dengan nama class public.</p><h2>Latihan</h2><ol><li>Ganti pesan dengan nama dan alasanmu belajar Java.</li><li>Tambahkan dua baris output.</li><li>Hapus satu titik koma, baca pesan compiler, lalu perbaiki.</li></ol><h2>Checklist</h2><ul><li><code>java -version</code> dan <code>javac -version</code> berhasil.</li><li>Program dapat dikompilasi tanpa error.</li><li>Kamu dapat menjelaskan alur source code → bytecode → JVM.</li></ul>`,
		},
		{
			Title:       "Variabel, Tipe Data, Operator, dan Konversi",
			Description: "Kelola data dengan tipe yang tepat dan lakukan perhitungan secara aman.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Mendeklarasikan variabel dengan nama yang jelas.</li><li>Memilih tipe primitif atau <code>String</code>.</li><li>Menggunakan operator dan konversi tipe.</li></ul><h2>Tipe data utama</h2><p>Gunakan <code>int</code> untuk bilangan bulat, <code>double</code> untuk pecahan, <code>boolean</code> untuk kondisi, <code>char</code> untuk satu karakter, dan <code>String</code> untuk teks. Pilih tipe berdasarkan makna data, bukan sekadar contoh yang sedang dikerjakan.</p><pre><code>String nama = "Aisyah";
int usia = 19;
double nilai = 87.5;
boolean lulus = nilai &gt;= 75;

int harga = 15_000;
int jumlah = 3;
double total = harga * jumlah * 1.11;</code></pre><h2>Konversi yang disengaja</h2><p>Pembagian dua <code>int</code> menghasilkan <code>int</code>. Gunakan casting ketika membutuhkan pecahan: <code>(double) totalNilai / jumlahData</code>. Untuk input teks, gunakan <code>Integer.parseInt</code> atau <code>Double.parseDouble</code> dan siapkan penanganan error.</p><h2>Latihan</h2><ol><li>Buat program biodata dengan minimal lima tipe data.</li><li>Hitung luas dan keliling persegi panjang.</li><li>Hitung subtotal, pajak 11%, dan total belanja.</li><li>Uji perbedaan hasil <code>5 / 2</code> dan <code>5.0 / 2</code>.</li></ol><h2>Checklist</h2><ul><li>Nama variabel menjelaskan isi.</li><li>Tipe data sesuai kebutuhan rentang dan pecahan.</li><li>Kamu memahami prioritas operator dan casting.</li></ul>`,
		},
		{
			Title:       "Input Pengguna dan Percabangan",
			Description: "Buat program interaktif dengan Scanner, validasi input, if-else, dan switch.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membaca input menggunakan <code>Scanner</code>.</li><li>Menyusun kondisi dengan <code>if</code>, <code>else if</code>, dan <code>else</code>.</li><li>Menggunakan <code>switch</code> untuk pilihan diskret.</li></ul><h2>Membaca dan memeriksa input</h2><pre><code>Scanner input = new Scanner(System.in);
System.out.print("Masukkan nilai 0-100: ");

if (input.hasNextInt()) {
    int nilai = input.nextInt();
    if (nilai &lt; 0 || nilai &gt; 100) {
        System.out.println("Nilai di luar rentang");
    } else if (nilai &gt;= 75) {
        System.out.println("Lulus");
    } else {
        System.out.println("Belum lulus");
    }
} else {
    System.out.println("Input harus berupa angka");
}</code></pre><p>Susun kondisi dari aturan yang paling spesifik. Gunakan <code>&amp;&amp;</code> untuk “dan”, <code>||</code> untuk “atau”, dan <code>!</code> untuk negasi. <code>switch</code> cocok untuk menu atau kategori yang nilainya jelas.</p><h2>Latihan</h2><ol><li>Konversikan nilai angka menjadi predikat A–E.</li><li>Buat pemeriksa tahun kabisat.</li><li>Buat menu kalkulator dengan <code>switch</code>.</li><li>Uji nilai batas seperti 0, 74, 75, dan 100.</li></ol><h2>Checklist</h2><ul><li>Input salah tidak membuat program berhenti mendadak.</li><li>Semua cabang kondisi pernah diuji.</li><li>Pesan kesalahan menjelaskan cara memperbaiki input.</li></ul>`,
		},
		{
			Title:       "Perulangan dan Pemecahan Masalah Iteratif",
			Description: "Gunakan for, while, nested loop, accumulator, dan sentinel tanpa infinite loop.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Memilih <code>for</code> atau <code>while</code> sesuai masalah.</li><li>Menggunakan counter dan accumulator.</li><li>Mencegah infinite loop dan kesalahan batas.</li></ul><h2>Pola loop yang aman</h2><pre><code>int total = 0;
int jumlahData = 0;

for (int angka = 1; angka &lt;= 10; angka++) {
    if (angka % 2 == 0) {
        total += angka;
        jumlahData++;
    }
}

double rataRata = (double) total / jumlahData;</code></pre><p><code>for</code> cocok ketika jumlah iterasi diketahui. <code>while</code> cocok ketika pengulangan berhenti berdasarkan kondisi, misalnya meminta input sampai valid. Setiap loop harus memiliki nilai awal, kondisi berhenti, dan perubahan state yang jelas.</p><h2>Latihan</h2><ol><li>Tampilkan bilangan prima dari 2 sampai 100.</li><li>Buat tabel perkalian angka pilihan pengguna.</li><li>Hitung rata-rata nilai sampai pengguna memasukkan sentinel <code>-1</code>.</li><li>Buat pola segitiga menggunakan nested loop.</li></ol><h2>Checklist</h2><ul><li>Loop berhenti untuk semua input yang valid.</li><li>Batas awal dan akhir sudah diuji.</li><li>Accumulator diinisialisasi sebelum loop.</li><li>Tidak ada pembagian dengan nol.</li></ul>`,
		},
		{
			Title:       "Method, Parameter, Return Value, dan Debugging",
			Description: "Pecah program menjadi method kecil, mudah diuji, dan mudah ditelusuri saat error.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membuat method dengan satu tanggung jawab.</li><li>Mengirim nilai melalui parameter dan <code>return</code>.</li><li>Memahami scope, overload, dan dasar debugging.</li></ul><h2>Method yang dapat diuji</h2><pre><code>static int hitungSubtotal(int harga, int jumlah) {
    if (harga &lt; 0 || jumlah &lt; 0) {
        throw new IllegalArgumentException("Nilai tidak boleh negatif");
    }
    return harga * jumlah;
}

static boolean isLulus(double nilai) {
    return nilai &gt;= 75;
}</code></pre><p>Nama method sebaiknya berupa kata kerja. Parameter hanya berisi data yang benar-benar dibutuhkan. Hindari method panjang yang membaca input, menghitung, dan menampilkan hasil sekaligus. Pecah menjadi bagian kecil sehingga setiap bagian mudah diuji.</p><h2>Strategi debugging</h2><p>Baca baris pertama pesan error yang menunjuk ke kode milikmu. Periksa nilai variabel di sekitar baris tersebut. Buat contoh input terkecil yang masih menghasilkan masalah, lalu perbaiki satu penyebab dalam satu waktu.</p><h2>Latihan</h2><ol><li>Pindahkan logika kalkulator ke empat method.</li><li>Buat method untuk menentukan nilai tertinggi dari tiga angka.</li><li>Buat overload method <code>hitungLuas</code> untuk persegi dan persegi panjang.</li><li>Uji method dengan input normal, nol, dan negatif.</li></ol><h2>Checklist</h2><ul><li>Setiap method melakukan satu hal.</li><li>Tipe return dan parameter tepat.</li><li>Tidak ada duplikasi logika.</li><li>Pesan error menyertakan konteks yang berguna.</li></ul>`,
		},
		{
			Title:       "Array dan Pengolahan String",
			Description: "Simpan kumpulan data berukuran tetap dan olah teks dengan method String.",
			Duration:    "2 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membuat, mengakses, dan menelusuri array.</li><li>Mencegah index di luar batas.</li><li>Mengolah teks dengan method <code>String</code>.</li></ul><h2>Mengolah kumpulan nilai</h2><pre><code>int[] nilai = {80, 92, 76, 88};
int tertinggi = nilai[0];
int total = 0;

for (int item : nilai) {
    total += item;
    if (item &gt; tertinggi) {
        tertinggi = item;
    }
}

double rataRata = (double) total / nilai.length;</code></pre><h2>String bersifat immutable</h2><p>Method seperti <code>trim</code>, <code>toLowerCase</code>, dan <code>replace</code> menghasilkan String baru. Simpan hasilnya jika ingin digunakan. Bandingkan isi String memakai <code>equals</code> atau <code>equalsIgnoreCase</code>, bukan <code>==</code>.</p><pre><code>String nama = "  Budi Santoso  ";
String bersih = nama.trim();
boolean cocok = bersih.equalsIgnoreCase("budi santoso");</code></pre><h2>Latihan</h2><ol><li>Cari nilai tertinggi, terendah, dan rata-rata.</li><li>Hitung jumlah nilai yang mencapai KKM.</li><li>Balik sebuah kata menggunakan loop.</li><li>Buat pencarian nama yang tidak peka huruf besar/kecil.</li></ol><h2>Checklist</h2><ul><li>Index selalu berada antara 0 dan <code>length - 1</code>.</li><li>Array kosong ditangani sebelum membaca elemen pertama.</li><li>String dibandingkan berdasarkan isinya.</li></ul>`,
		},
		{
			Title:       "OOP Dasar: Class, Object, dan Encapsulation",
			Description: "Modelkan data dan perilaku dengan class, constructor, object, dan encapsulation.",
			Duration:    "3 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Membedakan class dan object.</li><li>Membuat constructor yang menghasilkan state valid.</li><li>Melindungi field menggunakan encapsulation.</li></ul><h2>Class yang menjaga aturannya sendiri</h2><pre><code>public class Produk {
    private final String nama;
    private int harga;

    public Produk(String nama, int harga) {
        if (nama == null || nama.isBlank()) {
            throw new IllegalArgumentException("Nama wajib diisi");
        }
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
}</code></pre><p>Class adalah cetak biru dan object adalah instance-nya. Field dibuat <code>private</code> agar perubahan melewati method yang mempertahankan aturan object. Constructor sebaiknya menolak state yang tidak valid sejak awal.</p><h2>Latihan</h2><ol><li>Buat class <code>Mahasiswa</code> dengan nama dan kumpulan nilai.</li><li>Tambahkan method untuk menghitung rata-rata dan status lulus.</li><li>Buat tiga object dan tampilkan ringkasannya.</li><li>Jelaskan field mana yang layak memakai <code>final</code>.</li></ol><h2>Checklist</h2><ul><li>Constructor selalu menghasilkan object valid.</li><li>Field penting tidak dapat diubah langsung.</li><li>Perilaku ditempatkan pada class yang bertanggung jawab.</li></ul>`,
		},
		{
			Title:       "Inheritance, Polymorphism, dan Interface",
			Description: "Gunakan abstraksi dan polymorphism tanpa membuat hierarki class yang rapuh.",
			Duration:    "3 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Memahami relasi is-a dan has-a.</li><li>Melakukan override method.</li><li>Menggunakan interface dan polymorphism.</li></ul><h2>Kontrak perilaku dengan interface</h2><pre><code>interface Pembayaran {
    boolean proses(double jumlah);
}

class PembayaranTunai implements Pembayaran {
    private final double uangDiterima;

    PembayaranTunai(double uangDiterima) {
        this.uangDiterima = uangDiterima;
    }

    @Override
    public boolean proses(double jumlah) {
        return uangDiterima &gt;= jumlah;
    }
}</code></pre><p>Polymorphism memungkinkan kode bekerja melalui tipe kontrak. Variabel bertipe <code>Pembayaran</code> dapat menerima berbagai implementasi. Pilih inheritance hanya ketika hubungan “is-a” benar. Untuk berbagi komponen, composition atau hubungan “has-a” sering lebih aman.</p><h2>Latihan</h2><ol><li>Buat interface <code>DapatDicetak</code>.</li><li>Implementasikan pada class <code>Struk</code> dan <code>Laporan</code>.</li><li>Buat list bertipe interface dan panggil method yang sama.</li><li>Bandingkan solusi inheritance dengan composition.</li></ol><h2>Checklist</h2><ul><li>Override memakai anotasi <code>@Override</code>.</li><li>Caller bergantung pada kontrak, bukan implementasi spesifik.</li><li>Hierarki class tidak dibuat hanya untuk menghindari duplikasi kecil.</li></ul>`,
		},
		{
			Title:       "Collections, Generics, dan Exception Handling",
			Description: "Kelola data dinamis dengan List dan Map serta tangani kegagalan secara terkontrol.",
			Duration:    "3 Jam",
			Content: `<h2>Tujuan belajar</h2><ul><li>Memilih <code>List</code>, <code>Set</code>, atau <code>Map</code>.</li><li>Menggunakan generics untuk keamanan tipe.</li><li>Menangani exception tanpa menyembunyikan masalah.</li></ul><h2>Collection bertipe jelas</h2><pre><code>List&lt;Produk&gt; keranjang = new ArrayList&lt;&gt;();
keranjang.add(new Produk("Kopi", 15_000));
keranjang.add(new Produk("Roti", 12_000));

Map&lt;String, Integer&gt; stok = new HashMap&lt;&gt;();
stok.put("Kopi", 10);
int stokKopi = stok.getOrDefault("Kopi", 0);</code></pre><p><code>List</code> menjaga urutan dan menerima duplikasi. <code>Set</code> menjaga keunikan. <code>Map</code> menyimpan pasangan key-value. Generics seperti <code>List&lt;Produk&gt;</code> mencegah tipe yang salah masuk ke collection.</p><h2>Exception yang bermakna</h2><pre><code>try {
    int jumlah = Integer.parseInt(inputJumlah);
    if (jumlah &lt;= 0) {
        throw new IllegalArgumentException("Jumlah harus lebih dari nol");
    }
} catch (NumberFormatException error) {
    System.out.println("Masukkan jumlah berupa angka");
} catch (IllegalArgumentException error) {
    System.out.println(error.getMessage());
}</code></pre><h2>Latihan</h2><ol><li>Ubah array keranjang menjadi <code>ArrayList</code>.</li><li>Buat frekuensi kata menggunakan <code>Map</code>.</li><li>Validasi input angka dan tampilkan pesan yang dapat ditindaklanjuti.</li><li>Jelaskan kapan exception sebaiknya diteruskan ke caller.</li></ol><h2>Checklist</h2><ul><li>Collection dipilih berdasarkan kebutuhan.</li><li>Tidak menggunakan raw type.</li><li><code>catch</code> tidak kosong.</li><li>Exception tidak dipakai untuk alur normal program.</li></ul>`,
		},
		{
			Title:       "Proyek Praktik: Aplikasi Kasir Berbasis Terminal",
			Description: "Gabungkan fondasi Java menjadi aplikasi kasir yang modular, tervalidasi, dan mudah diuji.",
			Duration:    "4 Jam",
			Content: `<h2>Tujuan proyek</h2><ul><li>Menyusun program dari beberapa class dan method kecil.</li><li>Menggunakan collection, interface, dan exception.</li><li>Menguji alur normal dan edge case.</li></ul><h2>Rancangan minimum</h2><pre><code>class ItemBelanja {
    private final Produk produk;
    private final int jumlah;

    int subtotal() {
        return produk.getHarga() * jumlah;
    }
}

interface AturanDiskon {
    double hitung(double subtotal);
}</code></pre><p>Buat class <code>Produk</code>, <code>ItemBelanja</code>, <code>Keranjang</code>, dan <code>KasirApp</code>. Gunakan <code>List</code> untuk keranjang. Pisahkan pembacaan input dari perhitungan agar logika dapat diuji tanpa terminal.</p><h2>Tahapan pengerjaan</h2><ol><li>Tulis acceptance criteria dan pseudocode.</li><li>Buat model data dan validasinya.</li><li>Tambahkan katalog serta keranjang.</li><li>Tambahkan subtotal, diskon, pembayaran, dan kembalian.</li><li>Cetak struk terformat.</li><li>Uji input kosong, angka salah, stok tidak cukup, dan pembayaran kurang.</li></ol><h2>Latihan</h2><ol><li>Mulai dengan dua produk dan satu transaksi sukses.</li><li>Tambahkan pembatalan item.</li><li>Tambahkan strategi diskon melalui interface.</li><li>Refactor method yang lebih dari satu tanggung jawab.</li></ol><h2>Checklist</h2><ul><li>Kode dapat dikompilasi dan dijalankan dari terminal.</li><li>Input invalid tidak membuat aplikasi crash.</li><li>Perhitungan tidak bercampur dengan tampilan.</li><li>Struk mudah dibaca dan hasil hitung benar.</li><li>README menjelaskan cara menjalankan proyek.</li></ul>`,
		},
	}
}

func javaQuizSeeds() []quizSeed {
	return []quizSeed{
		{
			Title:        "Kuis 1: Fondasi Sintaks dan Alur Program",
			Description:  "Ukur pemahaman tentang JVM, tipe data, kondisi, perulangan, dan method.",
			PassingScore: 70,
			TimeLimit:    15,
			Questions: []questionSeed{
				{Text: "Komponen yang menjalankan bytecode Java adalah...", Options: []string{"JVM", "JDK", "javac", "IDE"}, CorrectAnswer: "JVM", Points: 20},
				{Text: "Tipe data untuk kondisi benar atau salah adalah...", Options: []string{"String", "boolean", "double", "char"}, CorrectAnswer: "boolean", Points: 20},
				{Text: "Operator logika AND di Java ditulis sebagai...", Options: []string{"&", "&&", "and", "||"}, CorrectAnswer: "&&", Points: 20},
				{Text: "Loop yang paling sesuai ketika jumlah iterasi telah diketahui adalah...", Options: []string{"for", "while", "switch", "if"}, CorrectAnswer: "for", Points: 20},
				{Text: "Kata kunci untuk mengembalikan hasil dari method adalah...", Options: []string{"break", "continue", "return", "static"}, CorrectAnswer: "return", Points: 20},
			},
		},
		{
			Title:        "Kuis 2: Array, String, dan OOP",
			Description:  "Periksa kesiapanmu mengelola data dan membuat object yang menjaga aturannya.",
			PassingScore: 70,
			TimeLimit:    15,
			Questions: []questionSeed{
				{Text: "Index pertama array Java adalah...", Options: []string{"0", "1", "-1", "Bergantung ukuran"}, CorrectAnswer: "0", Points: 20},
				{Text: "Method untuk membandingkan isi dua String adalah...", Options: []string{"==", "equals", "compare", "same"}, CorrectAnswer: "equals", Points: 20},
				{Text: "Cetak biru untuk membuat object disebut...", Options: []string{"method", "class", "package", "variable"}, CorrectAnswer: "class", Points: 20},
				{Text: "Modifier yang umum dipakai untuk melindungi field adalah...", Options: []string{"public", "static", "private", "abstract"}, CorrectAnswer: "private", Points: 20},
				{Text: "Kemampuan memakai berbagai implementasi melalui satu tipe kontrak disebut...", Options: []string{"Polymorphism", "Casting", "Looping", "Parsing"}, CorrectAnswer: "Polymorphism", Points: 20},
			},
		},
		{
			Title:        "Kuis 3: Collections dan Penanganan Error",
			Description:  "Pastikan kamu siap membangun proyek akhir dengan data dinamis dan validasi kuat.",
			PassingScore: 70,
			TimeLimit:    15,
			Questions: []questionSeed{
				{Text: "Collection yang menjaga urutan dan menerima duplikasi adalah...", Options: []string{"List", "Set", "Map", "Optional"}, CorrectAnswer: "List", Points: 20},
				{Text: "Struktur yang menyimpan pasangan key-value adalah...", Options: []string{"Map", "List", "Queue", "Array"}, CorrectAnswer: "Map", Points: 20},
				{Text: "Exception saat teks gagal dikonversi menjadi angka adalah...", Options: []string{"NumberFormatException", "IOException", "NullPointerException", "ClassCastException"}, CorrectAnswer: "NumberFormatException", Points: 20},
				{Text: "Blok yang menangani exception adalah...", Options: []string{"catch", "throw", "extends", "import"}, CorrectAnswer: "catch", Points: 20},
				{Text: "Keuntungan utama generics seperti List<Produk> adalah...", Options: []string{"Keamanan tipe saat kompilasi", "Program selalu lebih cepat", "Tidak memerlukan object", "Menghapus semua exception"}, CorrectAnswer: "Keamanan tipe saat kompilasi", Points: 20},
			},
		},
	}
}

func javaAssignmentSeeds() []assignmentSeed {
	return []assignmentSeed{
		{
			Title:        "Tugas Praktik: Rekap Nilai Siswa",
			Description:  "Bangun program untuk membaca, memvalidasi, mengolah, dan merangkum sekumpulan nilai.",
			DueAfter:     30 * 24 * time.Hour,
			Instructions: `<h2>Tujuan tugas</h2><p>Terapkan variabel, input, percabangan, loop, method, array, dan String dalam satu program kecil.</p><h2>Ketentuan</h2><ul><li>Program meminta nama siswa dan minimal lima nilai.</li><li>Setiap nilai harus berada pada rentang 0–100.</li><li>Perhitungan rata-rata, nilai tertinggi, nilai terendah, dan status lulus diletakkan pada method terpisah.</li><li>Program menampilkan ringkasan yang rapi.</li><li>Input bukan angka atau di luar rentang harus ditangani.</li></ul><h2>Yang dikumpulkan</h2><ul><li>Seluruh file <code>.java</code>.</li><li>Screenshot minimal tiga skenario pengujian.</li><li>README berisi cara menjalankan dan keputusan desain.</li></ul><h2>Rubrik</h2><ul><li>Ketepatan hasil: 35 poin.</li><li>Validasi dan edge case: 25 poin.</li><li>Struktur method dan penamaan: 25 poin.</li><li>Dokumentasi serta kerapian output: 15 poin.</li></ul>`,
		},
		{
			Title:        "Proyek Akhir: Aplikasi Kasir Mini",
			Description:  "Gabungkan seluruh konsep course dalam aplikasi Java berbasis terminal yang modular.",
			DueAfter:     60 * 24 * time.Hour,
			Instructions: `<h2>Target proyek</h2><p>Buat aplikasi kasir yang mengelola katalog, keranjang belanja, diskon, pembayaran, kembalian, dan struk.</p><h2>Kriteria wajib</h2><ul><li>Gunakan class <code>Produk</code>, <code>ItemBelanja</code>, dan <code>Keranjang</code> dengan encapsulation.</li><li>Gunakan <code>List</code> atau <code>Map</code> untuk data yang dinamis.</li><li>Pisahkan input/output dari logika perhitungan.</li><li>Gunakan interface untuk minimal satu variasi perilaku, misalnya aturan diskon atau pembayaran.</li><li>Validasi jumlah, stok, dan pembayaran; tangani input angka yang salah.</li><li>Tampilkan struk yang rapi dan konsisten.</li></ul><h2>Skenario pengujian minimum</h2><ul><li>Transaksi normal dengan lebih dari satu produk.</li><li>Jumlah barang nol atau negatif.</li><li>Produk tidak ditemukan atau stok tidak cukup.</li><li>Pembayaran kurang.</li><li>Transaksi yang mendapat diskon.</li></ul><h2>Yang dikumpulkan</h2><ul><li>Kode sumber Java yang dapat dikompilasi.</li><li>README berisi struktur class dan cara menjalankan.</li><li>Screenshot hasil semua skenario pengujian.</li><li>Catatan refleksi singkat tentang keputusan desain dan perbaikan berikutnya.</li></ul><h2>Rubrik</h2><ul><li>Fungsionalitas dan ketepatan perhitungan: 35 poin.</li><li>OOP, collection, dan struktur program: 30 poin.</li><li>Validasi serta penanganan error: 20 poin.</li><li>Kerapian output dan dokumentasi: 15 poin.</li></ul>`,
		},
	}
}
