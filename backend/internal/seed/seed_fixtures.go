package seed

// ─── Template Types ───────────────────────────────────────────────────────────

type courseTemplate struct {
	Title, Slug, Description, ShortDescription, Category, Level, Duration, Status string
	Price                                                                          int
}

type moduleTemplate struct {
	Title, Description, Content string
}

type attachmentTemplate struct {
	Name, URL, Type string
	Size            int64
}

type questionTemplate struct {
	Type, Text, CorrectAnswer string
	Options                   []string
}

type assignmentTemplate struct {
	Title, Description, Instructions string
}

type notifTemplate struct {
	Title, Message, Type, Link string
}

// ─── Teacher & Student Names ──────────────────────────────────────────────────

var teacherNames = []string{
	"Budi Santoso", "Siti Rahayu", "Ahmad Hidayat", "Dewi Lestari",
	"Rizky Pratama", "Nur Fadilah", "Eko Wijaya", "Ratna Sari",
	"Hendra Gunawan", "Fitri Handayani", "Agus Setiawan", "Maya Putri",
}

var studentNames = []string{
	"John Doe", "Andi Saputra", "Rina Marlina", "Dimas Prasetyo", "Lina Kusuma",
	"Fajar Nugroho", "Sari Dewi", "Bayu Aditya", "Nisa Amelia", "Rendi Firmansyah",
	"Putri Wulandari", "Galih Ramadhan", "Indah Permata", "Yoga Pratama", "Citra Maharani",
	"Arif Budiman", "Wulan Sari", "Doni Setiawan", "Mega Puspita", "Ilham Maulana",
	"Tika Rahmawati", "Bima Sakti", "Anisa Fitri", "Raka Aditya", "Dina Safitri",
	"Fauzan Hakim", "Laras Kinanti", "Aldi Nugraha", "Sinta Dewi", "Hafiz Rahman",
	"Novi Anggraini", "Rizal Fahmi", "Ayu Lestari", "Dani Kurniawan", "Eka Putri",
	"Wahyu Hidayat", "Ratih Kumala", "Bagus Prasetya", "Intan Permatasari", "Joko Susilo",
	"Mira Handayani", "Taufik Ismail", "Yuni Rahayu", "Fikri Abdillah", "Lestari Ningrum",
	"Surya Darma", "Kartika Sari", "Hadi Wijaya", "Nurul Aini", "Bambang Suryanto",
	"Desi Natalia", "Irfan Habibi", "Siska Amalia", "Rangga Putra", "Melati Kusuma",
}

// ─── Course Templates ─────────────────────────────────────────────────────────

var courseTemplates = []courseTemplate{
	// Pemrograman (3)
	{Title: "Fullstack Web Developer dengan Go & Next.js", Slug: "fullstack-go-nextjs", Description: "Pelajari cara membangun aplikasi web modern menggunakan Golang untuk backend dan Next.js untuk frontend.", ShortDescription: "Membangun web modern dari nol.", Category: "Pemrograman", Level: "intermediate", Price: 1500000, Duration: "12 Minggu", Status: "published"},
	{Title: "Dasar Pemrograman Python untuk Pemula", Slug: "dasar-python-pemula", Description: "Kursus lengkap untuk mempelajari Python dari dasar hingga mahir membuat aplikasi sederhana.", ShortDescription: "Belajar Python dari nol.", Category: "Pemrograman", Level: "beginner", Price: 500000, Duration: "8 Minggu", Status: "published"},
	{Title: "Mobile App Development dengan Flutter", Slug: "mobile-flutter", Description: "Bangun aplikasi mobile cross-platform menggunakan Flutter dan Dart.", ShortDescription: "Buat app Android & iOS.", Category: "Pemrograman", Level: "intermediate", Price: 1200000, Duration: "10 Minggu", Status: "published"},
	// Desain (3)
	{Title: "UI/UX Design Masterclass", Slug: "uiux-masterclass", Description: "Kuasai prinsip desain antarmuka dan pengalaman pengguna menggunakan Figma.", ShortDescription: "Desain UI/UX profesional.", Category: "Desain", Level: "intermediate", Price: 900000, Duration: "8 Minggu", Status: "published"},
	{Title: "Graphic Design dengan Adobe Illustrator", Slug: "graphic-design-illustrator", Description: "Pelajari teknik desain grafis profesional menggunakan Adobe Illustrator.", ShortDescription: "Desain grafis dari dasar.", Category: "Desain", Level: "beginner", Price: 750000, Duration: "6 Minggu", Status: "published"},
	{Title: "Motion Graphics & After Effects", Slug: "motion-graphics-ae", Description: "Buat animasi dan motion graphics profesional dengan After Effects.", ShortDescription: "Animasi profesional.", Category: "Desain", Level: "advanced", Price: 1300000, Duration: "10 Minggu", Status: "draft"},
	// Bisnis (3)
	{Title: "Digital Marketing Strategy", Slug: "digital-marketing-strategy", Description: "Strategi pemasaran digital lengkap dari SEO, SEM, hingga social media marketing.", ShortDescription: "Kuasai digital marketing.", Category: "Bisnis", Level: "intermediate", Price: 800000, Duration: "6 Minggu", Status: "published"},
	{Title: "Entrepreneurship & Startup Building", Slug: "entrepreneurship-startup", Description: "Panduan lengkap membangun startup dari ide hingga pendanaan.", ShortDescription: "Bangun startup Anda.", Category: "Bisnis", Level: "beginner", Price: 600000, Duration: "8 Minggu", Status: "published"},
	{Title: "Financial Management untuk UMKM", Slug: "financial-management-umkm", Description: "Kelola keuangan bisnis kecil dan menengah secara profesional.", ShortDescription: "Manajemen keuangan UMKM.", Category: "Bisnis", Level: "beginner", Price: 450000, Duration: "4 Minggu", Status: "published"},
	// Data Science (3)
	{Title: "Data Science dengan Python & Pandas", Slug: "data-science-python", Description: "Analisis data menggunakan Python, Pandas, dan visualisasi dengan Matplotlib.", ShortDescription: "Analisis data profesional.", Category: "Data Science", Level: "intermediate", Price: 1100000, Duration: "10 Minggu", Status: "published"},
	{Title: "Machine Learning Fundamentals", Slug: "machine-learning-fundamentals", Description: "Dasar-dasar machine learning dari regresi hingga neural network.", ShortDescription: "Fondasi machine learning.", Category: "Data Science", Level: "advanced", Price: 1400000, Duration: "12 Minggu", Status: "published"},
	{Title: "SQL & Database Management", Slug: "sql-database-management", Description: "Kuasai SQL dan manajemen database relasional untuk analisis data.", ShortDescription: "SQL dari dasar hingga mahir.", Category: "Data Science", Level: "beginner", Price: 550000, Duration: "6 Minggu", Status: "draft"},
	// Bahasa (3)
	{Title: "English for Professional Communication", Slug: "english-professional", Description: "Tingkatkan kemampuan bahasa Inggris untuk komunikasi bisnis dan profesional.", ShortDescription: "Bahasa Inggris profesional.", Category: "Bahasa", Level: "intermediate", Price: 700000, Duration: "8 Minggu", Status: "published"},
	{Title: "Bahasa Jepang N5-N4", Slug: "bahasa-jepang-n5n4", Description: "Pelajari bahasa Jepang dari level N5 hingga N4 dengan metode interaktif.", ShortDescription: "Bahasa Jepang dasar.", Category: "Bahasa", Level: "beginner", Price: 650000, Duration: "12 Minggu", Status: "published"},
	{Title: "Mandarin untuk Bisnis", Slug: "mandarin-bisnis", Description: "Bahasa Mandarin praktis untuk keperluan bisnis dan perdagangan.", ShortDescription: "Mandarin bisnis praktis.", Category: "Bahasa", Level: "intermediate", Price: 800000, Duration: "10 Minggu", Status: "draft"},
}

// ─── Module Templates by Category ────────────────────────────────────────────

var moduleTemplatesByCategory = map[string][]moduleTemplate{
	"Pemrograman": {
		{Title: "Pengenalan dan Setup Environment", Description: "Instalasi tools dan konfigurasi lingkungan pengembangan.", Content: "<h2>Setup Environment</h2><p>Langkah pertama dalam pemrograman adalah menyiapkan environment yang tepat. Kita akan menginstall IDE, compiler, dan package manager yang dibutuhkan.</p><p>Pastikan sistem operasi Anda sudah terupdate dan memiliki koneksi internet yang stabil untuk mengunduh dependencies.</p>"},
		{Title: "Variabel, Tipe Data, dan Operator", Description: "Memahami dasar-dasar tipe data dan operasi.", Content: "<h2>Tipe Data Dasar</h2><p>Setiap bahasa pemrograman memiliki tipe data primitif seperti integer, float, string, dan boolean. Memahami tipe data adalah fondasi penting.</p><p>Operator aritmatika, perbandingan, dan logika digunakan untuk memanipulasi data dalam program.</p>"},
		{Title: "Control Flow dan Looping", Description: "If-else, switch, for loop, dan while loop.", Content: "<h2>Kontrol Alur Program</h2><p>Control flow memungkinkan program mengambil keputusan berdasarkan kondisi tertentu. If-else adalah struktur paling dasar untuk percabangan.</p><p>Loop digunakan untuk mengulang eksekusi blok kode. For loop cocok ketika jumlah iterasi diketahui.</p>"},
		{Title: "Fungsi dan Modularisasi", Description: "Membuat fungsi reusable dan organisasi kode.", Content: "<h2>Fungsi</h2><p>Fungsi adalah blok kode yang dapat dipanggil berulang kali. Fungsi membantu mengurangi duplikasi dan meningkatkan readability.</p><p>Parameter dan return value memungkinkan fungsi menerima input dan menghasilkan output.</p>"},
		{Title: "Struktur Data: Array dan Map", Description: "Koleksi data dan operasinya.", Content: "<h2>Array dan Slice</h2><p>Array menyimpan kumpulan elemen dengan tipe yang sama. Slice adalah versi dinamis dari array yang ukurannya bisa berubah.</p><p>Map atau dictionary menyimpan pasangan key-value untuk akses data yang cepat.</p>"},
		{Title: "Object-Oriented Programming", Description: "Konsep OOP: class, inheritance, polymorphism.", Content: "<h2>OOP Concepts</h2><p>Object-Oriented Programming mengorganisasi kode dalam bentuk objek yang memiliki properti dan method.</p><p>Inheritance memungkinkan class mewarisi behavior dari parent class, sementara polymorphism memungkinkan satu interface untuk berbagai implementasi.</p>"},
		{Title: "Error Handling dan Debugging", Description: "Menangani error dan teknik debugging.", Content: "<h2>Error Handling</h2><p>Error handling yang baik membuat aplikasi lebih robust. Try-catch atau error return pattern digunakan untuk menangkap dan menangani error.</p><p>Debugging adalah proses menemukan dan memperbaiki bug menggunakan tools seperti debugger dan logging.</p>"},
		{Title: "Project Akhir: Aplikasi CRUD", Description: "Membangun aplikasi lengkap dengan operasi CRUD.", Content: "<h2>Project CRUD</h2><p>Dalam project akhir ini, kita akan membangun aplikasi CRUD (Create, Read, Update, Delete) lengkap yang mengintegrasikan semua konsep yang telah dipelajari.</p><p>Aplikasi akan terhubung ke database dan memiliki antarmuka pengguna yang interaktif.</p>"},
	},
	"Desain": {
		{Title: "Prinsip Dasar Desain Visual", Description: "Warna, tipografi, layout, dan komposisi.", Content: "<h2>Prinsip Desain</h2><p>Desain visual yang baik didasarkan pada prinsip keseimbangan, kontras, penekanan, dan kesatuan. Elemen-elemen ini bekerja bersama menciptakan komposisi yang menarik.</p><p>Tipografi yang tepat meningkatkan readability dan memperkuat hierarki informasi.</p>"},
		{Title: "Teori Warna dan Palet", Description: "Memahami psikologi warna dan membuat palet.", Content: "<h2>Teori Warna</h2><p>Warna memiliki dampak psikologis yang kuat. Warna hangat seperti merah dan oranye memberi kesan energi, sementara warna dingin seperti biru memberi kesan tenang.</p><p>Color wheel membantu memilih kombinasi warna yang harmonis.</p>"},
		{Title: "Wireframing dan Prototyping", Description: "Membuat wireframe dan prototype interaktif.", Content: "<h2>Wireframe</h2><p>Wireframe adalah kerangka dasar sebuah halaman yang menunjukkan struktur dan layout tanpa detail visual. Ini membantu memvalidasi alur pengguna sebelum masuk ke desain detail.</p><p>Prototype interaktif memungkinkan testing usability sebelum development.</p>"},
		{Title: "Design System dan Komponen", Description: "Membangun design system yang konsisten.", Content: "<h2>Design System</h2><p>Design system adalah kumpulan komponen reusable dengan panduan penggunaan yang jelas. Ini memastikan konsistensi visual di seluruh produk.</p><p>Atomic design methodology memecah UI menjadi atoms, molecules, organisms, templates, dan pages.</p>"},
		{Title: "User Research dan Persona", Description: "Riset pengguna dan pembuatan persona.", Content: "<h2>User Research</h2><p>User research membantu memahami kebutuhan, perilaku, dan pain points pengguna. Metode seperti interview, survey, dan usability testing memberikan insight berharga.</p><p>Persona adalah representasi fiktif dari target pengguna berdasarkan data riset.</p>"},
		{Title: "Responsive Design", Description: "Desain yang adaptif untuk berbagai ukuran layar.", Content: "<h2>Responsive Design</h2><p>Responsive design memastikan tampilan optimal di desktop, tablet, dan mobile. Breakpoint dan grid system membantu mengatur layout yang fleksibel.</p><p>Mobile-first approach memulai desain dari layar terkecil lalu memperluas ke layar lebih besar.</p>"},
		{Title: "Animasi dan Micro-interactions", Description: "Menambahkan animasi untuk UX yang lebih baik.", Content: "<h2>Animasi UI</h2><p>Animasi yang tepat meningkatkan pengalaman pengguna dengan memberikan feedback visual dan memandu perhatian. Micro-interactions membuat interface terasa lebih hidup dan responsif.</p>"},
		{Title: "Portfolio dan Presentasi Desain", Description: "Menyusun portfolio dan mempresentasikan karya.", Content: "<h2>Portfolio Desain</h2><p>Portfolio yang kuat menampilkan proses desain, bukan hanya hasil akhir. Ceritakan masalah yang dipecahkan dan dampak solusi Anda.</p>"},
	},
	"Bisnis": {
		{Title: "Pengenalan Dunia Bisnis Digital", Description: "Landscape bisnis digital dan peluangnya.", Content: "<h2>Bisnis Digital</h2><p>Era digital membuka peluang bisnis yang tidak terbatas. E-commerce, SaaS, dan platform marketplace adalah model bisnis yang berkembang pesat.</p><p>Memahami ekosistem digital adalah langkah pertama menuju kesuksesan bisnis online.</p>"},
		{Title: "Business Model Canvas", Description: "Merancang model bisnis dengan BMC.", Content: "<h2>Business Model Canvas</h2><p>BMC adalah alat visual untuk merancang dan menganalisis model bisnis. Terdiri dari 9 blok: value proposition, customer segments, channels, revenue streams, dan lainnya.</p><p>Lean canvas adalah variasi BMC yang lebih cocok untuk startup.</p>"},
		{Title: "Marketing dan Branding", Description: "Strategi pemasaran dan membangun brand.", Content: "<h2>Marketing Strategy</h2><p>Marketing yang efektif dimulai dengan memahami target audience. Segmentasi pasar membantu fokus pada pelanggan yang paling potensial.</p><p>Branding yang kuat menciptakan diferensiasi dan loyalitas pelanggan.</p>"},
		{Title: "Manajemen Keuangan Dasar", Description: "Laporan keuangan, cash flow, dan budgeting.", Content: "<h2>Keuangan Bisnis</h2><p>Memahami laporan keuangan (neraca, laba rugi, arus kas) adalah keterampilan wajib bagi pebisnis. Cash flow management menentukan kelangsungan bisnis.</p><p>Budgeting membantu mengalokasikan sumber daya secara efisien.</p>"},
		{Title: "Sales dan Customer Relationship", Description: "Teknik penjualan dan membangun hubungan pelanggan.", Content: "<h2>Sales Strategy</h2><p>Penjualan yang sukses didasarkan pada pemahaman kebutuhan pelanggan. Consultative selling fokus pada solusi, bukan produk.</p><p>CRM (Customer Relationship Management) membantu mengelola interaksi dengan pelanggan secara sistematis.</p>"},
		{Title: "Legal dan Perizinan Usaha", Description: "Aspek hukum dalam menjalankan bisnis.", Content: "<h2>Aspek Legal</h2><p>Setiap bisnis memerlukan legalitas yang tepat. PT, CV, atau usaha perorangan memiliki implikasi hukum dan pajak yang berbeda.</p><p>Perizinan usaha melindungi bisnis dan memberikan kepercayaan kepada pelanggan.</p>"},
		{Title: "Scaling dan Growth Strategy", Description: "Strategi pertumbuhan bisnis.", Content: "<h2>Growth Strategy</h2><p>Scaling bisnis memerlukan sistem yang scalable, tim yang solid, dan strategi pertumbuhan yang terukur. Growth hacking menggunakan eksperimen cepat untuk menemukan channel pertumbuhan.</p>"},
		{Title: "Pitch Deck dan Fundraising", Description: "Menyusun pitch deck dan mencari pendanaan.", Content: "<h2>Fundraising</h2><p>Pitch deck yang menarik menceritakan masalah, solusi, market size, traction, dan tim. Investor mencari bisnis dengan potensi return yang tinggi dan tim yang capable.</p>"},
	},
	"Data Science": {
		{Title: "Pengenalan Data Science", Description: "Apa itu data science dan perannya.", Content: "<h2>Data Science</h2><p>Data science menggabungkan statistik, pemrograman, dan domain knowledge untuk mengekstrak insight dari data. Peran data scientist semakin krusial di era big data.</p><p>Pipeline data science meliputi pengumpulan, pembersihan, analisis, dan visualisasi data.</p>"},
		{Title: "Statistik dan Probabilitas", Description: "Dasar statistik untuk analisis data.", Content: "<h2>Statistik Dasar</h2><p>Statistik deskriptif (mean, median, standar deviasi) merangkum karakteristik data. Statistik inferensial memungkinkan generalisasi dari sampel ke populasi.</p><p>Probabilitas adalah fondasi untuk machine learning dan pengambilan keputusan berbasis data.</p>"},
		{Title: "Data Cleaning dan Preprocessing", Description: "Membersihkan dan menyiapkan data.", Content: "<h2>Data Preprocessing</h2><p>Data mentah sering mengandung missing values, outlier, dan inkonsistensi. Data cleaning memastikan kualitas data sebelum analisis.</p><p>Feature engineering mengubah data mentah menjadi fitur yang informatif untuk model.</p>"},
		{Title: "Visualisasi Data", Description: "Membuat visualisasi yang informatif.", Content: "<h2>Data Visualization</h2><p>Visualisasi yang baik menceritakan cerita dari data. Chart yang tepat dipilih berdasarkan jenis data dan pesan yang ingin disampaikan.</p><p>Tools seperti Matplotlib, Seaborn, dan Plotly membantu membuat visualisasi interaktif.</p>"},
		{Title: "Machine Learning Basics", Description: "Algoritma ML dasar dan implementasinya.", Content: "<h2>Machine Learning</h2><p>Supervised learning menggunakan data berlabel untuk prediksi. Regresi untuk nilai kontinu, klasifikasi untuk kategori.</p><p>Unsupervised learning menemukan pola tersembunyi dalam data tanpa label, seperti clustering dan dimensionality reduction.</p>"},
		{Title: "SQL dan Query Database", Description: "Mengambil dan memanipulasi data dengan SQL.", Content: "<h2>SQL Fundamentals</h2><p>SQL adalah bahasa standar untuk berinteraksi dengan database relasional. SELECT, JOIN, GROUP BY, dan subquery adalah operasi fundamental.</p><p>Query optimization penting untuk performa saat bekerja dengan dataset besar.</p>"},
		{Title: "Big Data dan Cloud Computing", Description: "Mengelola data skala besar.", Content: "<h2>Big Data</h2><p>Big data ditandai dengan volume, velocity, dan variety yang tinggi. Tools seperti Spark dan Hadoop memproses data yang tidak muat di satu mesin.</p><p>Cloud platform (AWS, GCP, Azure) menyediakan infrastruktur scalable untuk data processing.</p>"},
		{Title: "Project: Dashboard Analitik", Description: "Membangun dashboard analitik end-to-end.", Content: "<h2>Project Dashboard</h2><p>Dalam project ini, kita membangun dashboard analitik yang menampilkan KPI bisnis secara real-time. Data pipeline mengalir dari sumber data ke visualisasi interaktif.</p>"},
	},
	"Bahasa": {
		{Title: "Pengenalan dan Alfabet", Description: "Sistem penulisan dan pengucapan dasar.", Content: "<h2>Alfabet dan Pengucapan</h2><p>Langkah pertama mempelajari bahasa baru adalah menguasai sistem penulisan dan pengucapan. Latihan mendengar dan mengulang sangat penting di tahap ini.</p><p>Phonetics membantu memahami bunyi-bunyi yang mungkin tidak ada dalam bahasa ibu.</p>"},
		{Title: "Kosakata Dasar dan Frasa Umum", Description: "Kata-kata dan frasa untuk percakapan sehari-hari.", Content: "<h2>Kosakata Dasar</h2><p>Menguasai 500-1000 kata paling umum memungkinkan pemahaman 80% percakapan sehari-hari. Flashcard dan spaced repetition efektif untuk menghafal kosakata.</p><p>Frasa umum seperti salam, perkenalan, dan bertanya arah adalah prioritas awal.</p>"},
		{Title: "Tata Bahasa Dasar", Description: "Struktur kalimat dan grammar fundamental.", Content: "<h2>Grammar Dasar</h2><p>Memahami struktur kalimat dasar (subjek-predikat-objek atau variasi lainnya) adalah fondasi untuk membentuk kalimat yang benar.</p><p>Tenses, partikel, dan konjugasi kata kerja bervariasi antar bahasa.</p>"},
		{Title: "Percakapan Sehari-hari", Description: "Latihan dialog untuk situasi umum.", Content: "<h2>Percakapan</h2><p>Kemampuan berbicara dikembangkan melalui latihan dialog dalam konteks nyata: di restoran, di kantor, saat berbelanja, dan situasi sosial lainnya.</p><p>Listening comprehension sama pentingnya dengan speaking ability.</p>"},
		{Title: "Membaca dan Menulis", Description: "Kemampuan literasi dalam bahasa target.", Content: "<h2>Reading & Writing</h2><p>Membaca teks autentik (artikel, cerita pendek) meningkatkan kosakata dan pemahaman grammar secara natural.</p><p>Menulis dimulai dari kalimat sederhana, paragraf, hingga esai pendek.</p>"},
		{Title: "Budaya dan Konteks Sosial", Description: "Memahami budaya di balik bahasa.", Content: "<h2>Budaya</h2><p>Bahasa tidak terpisah dari budaya. Memahami konteks sosial, tingkat kesopanan, dan norma komunikasi membuat penggunaan bahasa lebih natural dan tepat.</p>"},
		{Title: "Bahasa untuk Profesional", Description: "Kosakata dan ekspresi untuk dunia kerja.", Content: "<h2>Professional Language</h2><p>Bahasa profesional mencakup kosakata bisnis, penulisan email formal, presentasi, dan negosiasi. Register bahasa berbeda antara casual dan formal.</p>"},
		{Title: "Persiapan Ujian Sertifikasi", Description: "Strategi dan latihan untuk ujian bahasa.", Content: "<h2>Exam Preparation</h2><p>Ujian sertifikasi bahasa (TOEFL, JLPT, HSK) memiliki format dan strategi khusus. Latihan soal dan simulasi ujian meningkatkan kepercayaan diri dan skor.</p>"},
	},
}

// ─── Attachment Samples ───────────────────────────────────────────────────────

var attachmentSamples = []attachmentTemplate{
	{Name: "Materi Slide.pdf", URL: "/uploads/materi-slide.pdf", Type: "application/pdf", Size: 2048000},
	{Name: "Panduan Praktikum.pdf", URL: "/uploads/panduan-praktikum.pdf", Type: "application/pdf", Size: 1536000},
	{Name: "Template Project.zip", URL: "/uploads/template-project.zip", Type: "application/zip", Size: 5120000},
	{Name: "Video Tutorial.mp4", URL: "/uploads/video-tutorial.mp4", Type: "video/mp4", Size: 52428800},
	{Name: "Cheat Sheet.pdf", URL: "/uploads/cheat-sheet.pdf", Type: "application/pdf", Size: 512000},
	{Name: "Contoh Kode.zip", URL: "/uploads/contoh-kode.zip", Type: "application/zip", Size: 1024000},
	{Name: "Referensi Tambahan.docx", URL: "/uploads/referensi.docx", Type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", Size: 768000},
	{Name: "Diagram Arsitektur.png", URL: "/uploads/diagram-arsitektur.png", Type: "image/png", Size: 256000},
	{Name: "Dataset Latihan.csv", URL: "/uploads/dataset-latihan.csv", Type: "text/csv", Size: 4096000},
	{Name: "Rekaman Kelas.mp4", URL: "/uploads/rekaman-kelas.mp4", Type: "video/mp4", Size: 104857600},
}

// ─── Question Pool by Category ────────────────────────────────────────────────

var questionPoolByCategory = map[string][]questionTemplate{
	"Pemrograman": {
		{Type: "multiple_choice", Text: "Apa output dari 2 + '2' di JavaScript?", Options: []string{"4", "22", "NaN", "Error"}, CorrectAnswer: "22"},
		{Type: "multiple_choice", Text: "Manakah yang bukan tipe data primitif di Go?", Options: []string{"int", "string", "list", "bool"}, CorrectAnswer: "list"},
		{Type: "true_false", Text: "Python adalah bahasa pemrograman yang strongly typed.", Options: []string{"true", "false"}, CorrectAnswer: "true"},
		{Type: "multiple_choice", Text: "HTTP status code 404 berarti?", Options: []string{"Server Error", "Not Found", "Unauthorized", "Bad Request"}, CorrectAnswer: "Not Found"},
		{Type: "multiple_choice", Text: "Apa kepanjangan dari API?", Options: []string{"Application Programming Interface", "Applied Program Integration", "Application Process Interface", "Automated Programming Interface"}, CorrectAnswer: "Application Programming Interface"},
		{Type: "true_false", Text: "Git dan GitHub adalah hal yang sama.", Options: []string{"true", "false"}, CorrectAnswer: "false"},
		{Type: "multiple_choice", Text: "Manakah yang merupakan framework CSS?", Options: []string{"React", "Tailwind", "Node.js", "Django"}, CorrectAnswer: "Tailwind"},
		{Type: "multiple_choice", Text: "Apa fungsi dari Docker?", Options: []string{"Version control", "Containerization", "Database management", "Code editing"}, CorrectAnswer: "Containerization"},
		{Type: "true_false", Text: "REST API selalu menggunakan format JSON.", Options: []string{"true", "false"}, CorrectAnswer: "false"},
		{Type: "multiple_choice", Text: "Kompleksitas waktu binary search adalah?", Options: []string{"O(n)", "O(log n)", "O(n²)", "O(1)"}, CorrectAnswer: "O(log n)"},
		{Type: "multiple_choice", Text: "Manakah yang merupakan NoSQL database?", Options: []string{"PostgreSQL", "MySQL", "MongoDB", "SQLite"}, CorrectAnswer: "MongoDB"},
	},
	"Desain": {
		{Type: "multiple_choice", Text: "Prinsip desain yang mengatur jarak antar elemen disebut?", Options: []string{"Alignment", "Proximity", "Contrast", "Repetition"}, CorrectAnswer: "Proximity"},
		{Type: "multiple_choice", Text: "Format file yang mendukung transparansi adalah?", Options: []string{"JPEG", "PNG", "BMP", "TIFF"}, CorrectAnswer: "PNG"},
		{Type: "true_false", Text: "RGB adalah model warna untuk media cetak.", Options: []string{"true", "false"}, CorrectAnswer: "false"},
		{Type: "multiple_choice", Text: "Resolusi standar untuk desain web adalah?", Options: []string{"72 DPI", "150 DPI", "300 DPI", "600 DPI"}, CorrectAnswer: "72 DPI"},
		{Type: "multiple_choice", Text: "Apa itu wireframe?", Options: []string{"Desain final", "Kerangka layout dasar", "Animasi UI", "Color palette"}, CorrectAnswer: "Kerangka layout dasar"},
		{Type: "true_false", Text: "Sans-serif font lebih mudah dibaca di layar digital.", Options: []string{"true", "false"}, CorrectAnswer: "true"},
		{Type: "multiple_choice", Text: "Tool yang populer untuk UI/UX design adalah?", Options: []string{"Photoshop", "Figma", "AutoCAD", "Blender"}, CorrectAnswer: "Figma"},
		{Type: "multiple_choice", Text: "Warna komplementer dari biru adalah?", Options: []string{"Hijau", "Merah", "Oranye", "Ungu"}, CorrectAnswer: "Oranye"},
		{Type: "true_false", Text: "Usability testing sebaiknya dilakukan setelah produk selesai.", Options: []string{"true", "false"}, CorrectAnswer: "false"},
		{Type: "multiple_choice", Text: "Apa itu design token?", Options: []string{"Mata uang desainer", "Variabel desain yang reusable", "Plugin Figma", "Jenis font"}, CorrectAnswer: "Variabel desain yang reusable"},
		{Type: "multiple_choice", Text: "Aspect ratio standar untuk mobile adalah?", Options: []string{"16:9", "4:3", "9:16", "1:1"}, CorrectAnswer: "9:16"},
	},
	"Bisnis": {
		{Type: "multiple_choice", Text: "Apa kepanjangan dari ROI?", Options: []string{"Return on Investment", "Rate of Interest", "Revenue of Income", "Return on Income"}, CorrectAnswer: "Return on Investment"},
		{Type: "multiple_choice", Text: "Siapa yang menulis buku 'Lean Startup'?", Options: []string{"Peter Thiel", "Eric Ries", "Steve Jobs", "Elon Musk"}, CorrectAnswer: "Eric Ries"},
		{Type: "true_false", Text: "Break-even point adalah titik di mana pendapatan sama dengan biaya.", Options: []string{"true", "false"}, CorrectAnswer: "true"},
		{Type: "multiple_choice", Text: "Apa itu MVP dalam konteks startup?", Options: []string{"Most Valuable Player", "Minimum Viable Product", "Maximum Value Proposition", "Market Validation Process"}, CorrectAnswer: "Minimum Viable Product"},
		{Type: "multiple_choice", Text: "SEO adalah singkatan dari?", Options: []string{"Search Engine Optimization", "Social Engine Operation", "Search Email Outreach", "Site Enhancement Option"}, CorrectAnswer: "Search Engine Optimization"},
		{Type: "true_false", Text: "B2B berarti bisnis yang menjual langsung ke konsumen akhir.", Options: []string{"true", "false"}, CorrectAnswer: "false"},
		{Type: "multiple_choice", Text: "Apa fungsi utama CRM?", Options: []string{"Mengelola keuangan", "Mengelola hubungan pelanggan", "Mengelola inventori", "Mengelola karyawan"}, CorrectAnswer: "Mengelola hubungan pelanggan"},
		{Type: "multiple_choice", Text: "Tahap pertama dalam sales funnel adalah?", Options: []string{"Decision", "Awareness", "Action", "Interest"}, CorrectAnswer: "Awareness"},
		{Type: "true_false", Text: "Cash flow positif berarti perusahaan pasti untung.", Options: []string{"true", "false"}, CorrectAnswer: "false"},
		{Type: "multiple_choice", Text: "Apa itu pivot dalam bisnis?", Options: []string{"Menutup bisnis", "Mengubah strategi bisnis", "Menambah modal", "Merger perusahaan"}, CorrectAnswer: "Mengubah strategi bisnis"},
		{Type: "multiple_choice", Text: "KPI adalah singkatan dari?", Options: []string{"Key Performance Indicator", "Key Product Innovation", "Knowledge Process Integration", "Key Profit Index"}, CorrectAnswer: "Key Performance Indicator"},
	},
	"Data Science": {
		{Type: "multiple_choice", Text: "Library Python untuk manipulasi data tabular adalah?", Options: []string{"NumPy", "Pandas", "Matplotlib", "Scikit-learn"}, CorrectAnswer: "Pandas"},
		{Type: "multiple_choice", Text: "Apa itu overfitting?", Options: []string{"Model terlalu sederhana", "Model terlalu kompleks dan tidak generalize", "Data terlalu banyak", "Training terlalu cepat"}, CorrectAnswer: "Model terlalu kompleks dan tidak generalize"},
		{Type: "true_false", Text: "Median lebih robust terhadap outlier dibanding mean.", Options: []string{"true", "false"}, CorrectAnswer: "true"},
		{Type: "multiple_choice", Text: "Supervised learning membutuhkan?", Options: []string{"Data tanpa label", "Data berlabel", "GPU", "Big data"}, CorrectAnswer: "Data berlabel"},
		{Type: "multiple_choice", Text: "Apa itu feature engineering?", Options: []string{"Membuat fitur aplikasi", "Mengubah data mentah menjadi fitur informatif", "Mendesain hardware", "Optimasi database"}, CorrectAnswer: "Mengubah data mentah menjadi fitur informatif"},
		{Type: "true_false", Text: "Correlation implies causation.", Options: []string{"true", "false"}, CorrectAnswer: "false"},
		{Type: "multiple_choice", Text: "Algoritma clustering yang populer adalah?", Options: []string{"Linear Regression", "K-Means", "Decision Tree", "Naive Bayes"}, CorrectAnswer: "K-Means"},
		{Type: "multiple_choice", Text: "Apa fungsi dari cross-validation?", Options: []string{"Membersihkan data", "Mengevaluasi model secara robust", "Mengumpulkan data", "Visualisasi data"}, CorrectAnswer: "Mengevaluasi model secara robust"},
		{Type: "true_false", Text: "Random Forest adalah ensemble method.", Options: []string{"true", "false"}, CorrectAnswer: "true"},
		{Type: "multiple_choice", Text: "SQL JOIN yang mengembalikan semua baris dari kedua tabel adalah?", Options: []string{"INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"}, CorrectAnswer: "FULL OUTER JOIN"},
		{Type: "multiple_choice", Text: "Apa itu ETL?", Options: []string{"Extract Transform Load", "Evaluate Test Learn", "Enter Transfer Leave", "Edit Track Log"}, CorrectAnswer: "Extract Transform Load"},
	},
	"Bahasa": {
		{Type: "multiple_choice", Text: "Berapa jumlah huruf hiragana dasar dalam bahasa Jepang?", Options: []string{"26", "46", "71", "100"}, CorrectAnswer: "46"},
		{Type: "multiple_choice", Text: "Bahasa dengan penutur terbanyak di dunia adalah?", Options: []string{"English", "Mandarin", "Spanish", "Hindi"}, CorrectAnswer: "English"},
		{Type: "true_false", Text: "Bahasa Mandarin menggunakan sistem alfabet Latin.", Options: []string{"true", "false"}, CorrectAnswer: "false"},
		{Type: "multiple_choice", Text: "TOEFL mengukur kemampuan bahasa?", Options: []string{"Jepang", "Mandarin", "Inggris", "Korea"}, CorrectAnswer: "Inggris"},
		{Type: "multiple_choice", Text: "Apa itu cognate dalam linguistik?", Options: []string{"Kata yang mirip antar bahasa", "Tata bahasa", "Dialek", "Aksen"}, CorrectAnswer: "Kata yang mirip antar bahasa"},
		{Type: "true_false", Text: "Immersion adalah metode belajar bahasa yang efektif.", Options: []string{"true", "false"}, CorrectAnswer: "true"},
		{Type: "multiple_choice", Text: "Level tertinggi JLPT adalah?", Options: []string{"N5", "N3", "N1", "N0"}, CorrectAnswer: "N1"},
		{Type: "multiple_choice", Text: "Spaced repetition berguna untuk?", Options: []string{"Menulis esai", "Menghafal kosakata", "Belajar grammar", "Latihan speaking"}, CorrectAnswer: "Menghafal kosakata"},
		{Type: "true_false", Text: "Bahasa Korea menggunakan sistem penulisan Hangul.", Options: []string{"true", "false"}, CorrectAnswer: "true"},
		{Type: "multiple_choice", Text: "Berapa tone dalam bahasa Mandarin?", Options: []string{"2", "4", "5", "6"}, CorrectAnswer: "4"},
		{Type: "multiple_choice", Text: "Apa itu polyglot?", Options: []string{"Jenis font", "Orang yang menguasai banyak bahasa", "Metode belajar", "Aplikasi translate"}, CorrectAnswer: "Orang yang menguasai banyak bahasa"},
	},
}

// ─── Assignment Templates by Category ─────────────────────────────────────────

var assignmentTemplatesByCategory = map[string][]assignmentTemplate{
	"Pemrograman": {
		{Title: "Membuat REST API Sederhana", Description: "Buat REST API dengan endpoint CRUD.", Instructions: "Implementasikan REST API dengan minimal 4 endpoint (GET, POST, PUT, DELETE). Gunakan database PostgreSQL dan sertakan dokumentasi API."},
		{Title: "Aplikasi Todo List", Description: "Bangun aplikasi todo list fullstack.", Instructions: "Buat aplikasi todo list dengan frontend dan backend. Fitur: tambah, edit, hapus, dan tandai selesai. Deploy ke cloud."},
		{Title: "Unit Testing Project", Description: "Tulis unit test untuk modul yang diberikan.", Instructions: "Tulis minimal 10 unit test yang mencakup happy path dan edge cases. Gunakan testing framework standar bahasa yang dipilih."},
		{Title: "Refactoring Legacy Code", Description: "Refactor kode legacy menjadi clean code.", Instructions: "Refactor kode yang diberikan dengan menerapkan prinsip SOLID, DRY, dan clean code. Jelaskan setiap perubahan yang dilakukan."},
	},
	"Desain": {
		{Title: "Redesign Landing Page", Description: "Redesign landing page sebuah produk.", Instructions: "Redesign landing page dengan fokus pada conversion rate. Sertakan wireframe, mockup high-fidelity, dan prototype interaktif di Figma."},
		{Title: "Design System Components", Description: "Buat komponen design system.", Instructions: "Buat minimal 10 komponen UI (button, input, card, modal, dll) dengan variants dan states. Dokumentasikan usage guidelines."},
		{Title: "Mobile App UI Design", Description: "Desain UI untuk aplikasi mobile.", Instructions: "Desain minimal 5 screen untuk aplikasi mobile (splash, login, home, detail, profile). Gunakan auto-layout dan responsive constraints."},
		{Title: "Usability Testing Report", Description: "Lakukan usability testing dan buat laporan.", Instructions: "Rekrut 3-5 tester, buat task scenario, lakukan testing, dan dokumentasikan findings beserta rekomendasi perbaikan."},
	},
	"Bisnis": {
		{Title: "Business Plan Startup", Description: "Susun business plan lengkap.", Instructions: "Buat business plan mencakup executive summary, analisis pasar, strategi marketing, proyeksi keuangan 3 tahun, dan analisis risiko."},
		{Title: "Analisis Kompetitor", Description: "Lakukan analisis kompetitor mendalam.", Instructions: "Pilih 5 kompetitor di industri yang sama. Analisis kekuatan, kelemahan, strategi pricing, dan positioning masing-masing. Buat SWOT analysis."},
		{Title: "Marketing Campaign Plan", Description: "Rancang kampanye marketing digital.", Instructions: "Rancang kampanye marketing 1 bulan mencakup content calendar, budget allocation, target KPI, dan strategi per channel (SEO, SEM, Social Media)."},
		{Title: "Financial Projection", Description: "Buat proyeksi keuangan bisnis.", Instructions: "Buat proyeksi keuangan 12 bulan mencakup revenue forecast, cost structure, break-even analysis, dan cash flow statement."},
	},
	"Data Science": {
		{Title: "Exploratory Data Analysis", Description: "Lakukan EDA pada dataset yang diberikan.", Instructions: "Lakukan EDA lengkap: statistik deskriptif, distribusi data, korelasi, missing values, outlier detection. Visualisasikan findings dengan minimal 8 chart."},
		{Title: "Predictive Model", Description: "Bangun model prediktif.", Instructions: "Bangun model machine learning untuk prediksi. Lakukan feature engineering, model selection, hyperparameter tuning, dan evaluasi dengan cross-validation."},
		{Title: "Dashboard Visualization", Description: "Buat dashboard interaktif.", Instructions: "Buat dashboard dengan minimal 6 visualisasi interaktif. Gunakan tools seperti Streamlit, Dash, atau Tableau. Sertakan filter dan drill-down."},
		{Title: "SQL Query Challenge", Description: "Selesaikan tantangan SQL.", Instructions: "Selesaikan 10 soal SQL dari basic hingga advanced. Mencakup JOIN, subquery, window functions, CTE, dan query optimization."},
	},
	"Bahasa": {
		{Title: "Menulis Esai Pendek", Description: "Tulis esai 500 kata dalam bahasa target.", Instructions: "Tulis esai 500 kata tentang topik yang diberikan. Perhatikan grammar, kosakata, dan struktur paragraf. Gunakan minimal 5 kosakata baru."},
		{Title: "Presentasi Lisan", Description: "Rekam presentasi 5 menit.", Instructions: "Rekam video presentasi 5 menit dalam bahasa target. Topik bebas tapi harus menggunakan formal register. Perhatikan pronunciation dan intonasi."},
		{Title: "Terjemahan Artikel", Description: "Terjemahkan artikel ke bahasa target.", Instructions: "Terjemahkan artikel 300 kata yang diberikan. Fokus pada natural translation, bukan word-by-word. Sertakan catatan tentang pilihan terjemahan."},
		{Title: "Dialog Role-play", Description: "Buat dan praktikkan dialog.", Instructions: "Buat dialog 2 orang untuk situasi yang diberikan (di restoran, wawancara kerja, dll). Minimal 15 pertukaran. Rekam audio praktik dialog."},
	},
}

// ─── Notification Templates ───────────────────────────────────────────────────

var studentNotifTemplates = []notifTemplate{
	{Title: "Selamat Datang!", Message: "Selamat bergabung di kursus {courseTitle}. Mulai belajar sekarang!", Type: "info", Link: "/courses/{courseId}"},
	{Title: "Tugas Baru", Message: "Tugas baru telah ditambahkan di kursus {courseTitle}. Segera kerjakan!", Type: "warning", Link: "/courses/{courseId}/assignments"},
	{Title: "Nilai Tugas", Message: "Tugas Anda di {courseTitle} telah dinilai. Skor: {score}/100.", Type: "info", Link: "/courses/{courseId}/assignments"},
	{Title: "Sertifikat Tersedia", Message: "Selamat! Anda telah menyelesaikan {courseTitle} dan mendapat sertifikat.", Type: "success", Link: "/certificates"},
	{Title: "Pengingat Belajar", Message: "Anda belum membuka kursus {courseTitle} selama 3 hari. Yuk lanjutkan!", Type: "warning", Link: "/courses/{courseId}"},
	{Title: "Quiz Baru", Message: "Quiz baru tersedia di kursus {courseTitle}. Uji pemahaman Anda!", Type: "info", Link: "/courses/{courseId}/quizzes"},
}

var teacherNotifTemplates = []notifTemplate{
	{Title: "Pendaftaran Baru", Message: "Seorang siswa baru mendaftar di kursus {courseTitle}.", Type: "info", Link: "/dashboard/teacher"},
	{Title: "Submission Baru", Message: "Ada submission baru yang perlu dinilai di {courseTitle}.", Type: "warning", Link: "/dashboard/teacher/grading"},
	{Title: "Quiz Diselesaikan", Message: "Seorang siswa menyelesaikan quiz di {courseTitle}.", Type: "info", Link: "/dashboard/teacher"},
	{Title: "Kursus Populer", Message: "Kursus {courseTitle} Anda telah mencapai 20+ pendaftar!", Type: "success", Link: "/dashboard/teacher"},
	{Title: "Review Baru", Message: "Ada review baru untuk kursus {courseTitle} Anda.", Type: "info", Link: "/dashboard/teacher"},
}

// ─── Feedback Templates ───────────────────────────────────────────────────────

var feedbackTemplates = []string{
	"Bagus! Pekerjaan yang rapi dan sesuai instruksi.",
	"Sangat baik. Implementasi sudah benar dan well-documented.",
	"Good job! Ada beberapa minor improvement yang bisa dilakukan.",
	"Excellent work! Melebihi ekspektasi.",
	"Baik, tapi perlu perbaikan di bagian error handling.",
}
