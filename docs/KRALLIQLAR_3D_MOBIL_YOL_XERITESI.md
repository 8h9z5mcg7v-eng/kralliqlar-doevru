# Krallıqlar Dövrü — 3D mobil strategiya yol xəritəsi

## Məqsəd
Clash of Kings-dən ilhamlanan, lakin öz vizual üslubu və oyun məzmunu olan sıx, canlı orta əsr qala-şəhəri. Hədəf: Android və iPhone; ilkin büdcə: 0 AZN; iş aləti: iPhone.

## Qərar: mərhələli yanaşma
1. **İndi: Three.js + WebGL mobil prototipi.** Mövcud layihə brauzer əsaslıdır; sıfırdan başqa mühərrikə keçmədən səhnə, toxumalar, kamera və idarəetmə yenilənə bilər.
2. **Sonra: PWA / Android paketlənməsi.** Eyni oyun ekranı telefonda tam ekran işləsin, ikon və keş əlavə edilsin. Android üçün TWA/PWA yolu yoxlanılsın.
3. **iPhone tətbiqi:** iOS App Store-a yükləmək üçün son mərhələdə Apple imzalama və build prosesi lazımdır. Godot-un rəsmi sənədlərinə görə iOS export üçün macOS və Xcode tələb olunur; buna görə yalnız iPhone ilə native build-i indi vəd etmək düzgün deyil. Əvvəl mobil veb/PWA prototipi hazırlanacaq, sonra uyğun bulud build xidməti və Apple hesabı məsələsi yoxlanacaq.

## Pulsuz modellər — seçim müqayisəsi

| Aktiv | Nə verir | Lisenziya / uyğunluq | Qərar |
|---|---|---|---|
| [Kenney Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit) | Modul orta əsr şəhər hissələri; evlər, şəhər detalları və təkrarlana bilən parçalar | CC0 kimi təqdim olunur; kommersiya istifadəsi üçün də münasibdir | **Birinci seçim:** şəhəri hissə-hissə qurmaq üçün |
| [Kenney Castle Kit](https://kenney.nl/assets/castle-kit) | Qala, müdafiə və qala divarı elementləri | Kenney pulsuz aktivləri; konkret paket səhifəsində lisenziyanı yenidən yoxla | Divarlar, qüllələr və giriş qapısı üçün |
| [Quaternius — Medieval Village MegaKit](https://quaternius.com/) | Orta əsr kəndi üçün 3D modellər; GLTF/FBX kimi formatlar ola bilər | Paket səhifəsində CC0 və formatı yoxla | Əlavə evlər, dekor və kənd sahəsi üçün |
| Hazır ödənişli Unity paketləri | Daha cilalanmış və iri modul səhnələr | Büdcəyə uyğun deyil | İstifadə edilmir |

**Vacib:** Clash of Kings-in öz modellərini və fayllarını köçürməyəcəyik. Onun kompozisiya prinsiplərindən — izometrik kamera, divarlı şəhər, aydın binalar, resurs nöqtələri və sıx detallar — ilhamlanıb öz səhnəmizi quracağıq. Aktivlərin lisenziyasını yükləməzdən əvvəl həmin paket səhifəsində təsdiqləmək lazımdır.

## Şəhər səhnəsinin vizual spesifikasiyası
- İzometrik, yüngül perspektivli kamera; sürükləmə, iki barmaqla zoom və kamera sıfırlama.
- Mərkəzdə iri **Baş Qala**; ətrafında dörd tərəfli divar, qüllələr və ön giriş qapısı.
- Binalar ayrı-ayrı torpaq sahələrində: **Kazarma**, **Oxçuluq meydanı**, **Tövlə**, **Ferma**, **Anbar**, **Dəmirçi**, **Bazar**.
- Qala ilə giriş arasında daş yol; sahələr arasında cığırlar və kiçik meydan.
- Xarici zonada meşə, daş karxanası, əkin sahəsi, çay/kiçik körpü və müşahidə məntəqəsi.
- Binalar bir-birinin içinə girməsin: hər bina üçün sabit koordinat, ölçü sərhədi və seçilə bilən klik zonası.
- Vizual üslub: stilizə edilmiş əl işi orta əsr; isti gün işığı, yumşaq kölgələr, qırmızı-qəhvəyi damlar, daş divarlar, yaşıl torpaq və qızılı HUD.
- Mobil performans: təkrar modellər üçün instancing, az sayda dinamik işıq, tekstura ölçülərinin optimallaşdırılması və aşağı/orta qrafika seçimi.

## Konkret icra ardıcıllığı
1. **Səhnə auditı:** mövcud HTML-də təkrarlanan procedural obyektləri və toqquşan koordinatları müəyyən et; əsas şəhəri bir kök qrupda saxla.
2. **Asset pipeline:** lisenziyası təsdiqlənən GLB/glTF modelləri seç; faylları layihəyə lokal yerləşdir. Xarici URL-dən yüklənməyə kritik asılılıq yaratma.
3. **Greybox planı:** əvvəl bina ölçüləri və koordinatları ilə şəhər planını sabitlə; bütün binalar arasında minimum məsafə saxla.
4. **Model inteqrasiyası:** əvvəl qala + divar/qapı/qüllə; sonra kazarma, tövlə, ferma, evlər və dekor. Hər mərhələdə mobil ekranda yoxla.
5. **Oyun dövrəsi:** binaya toxunanda məlumat paneli, yüksəltmə xərci, istehsal və tikinti vəziyyəti. Eyni obyektə iki dəfə dekor əlavə edilməsin.
6. **Mobil UX:** 16:9 və portret ekranlarda sınaq; toxunma hədəfləri, menyular, kamera və modal pəncərələr.
7. **Android/iPhone yayımı:** əvvəl PWA və brauzer testi; sonra Android paketlənməsi; iOS üçün uyğun macOS/Xcode build və imzalama yolu təsdiqləndikdən sonra tətbiq paketi.

## Qəbul meyarları
- Qala, divarlar və ən azı 6 ayrı bina eyni anda görünür.
- Heç bir əsas bina başqa binanın içinə girmir.
- Əsas bina toxunmaqla seçilir; yüksəltmə və resurs sistemi işləyir.
- iPhone Safari-də sürükləmə, zoom və menyular işləyir.
- Model yüklənməsə, oyun tamamilə boş qalmır; ehtiyat səhnə işləyir.
- Oyunun heç bir vacib hissəsi ödənişli aktiv tələb etmir.

## Texniki qeydlər
- Godot iOS export sənədi: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_ios.html
- Godot Android export sənədi: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html
- Kenney Fantasy Town Kit: https://kenney.nl/assets/fantasy-town-kit
- Kenney Castle Kit: https://kenney.nl/assets/castle-kit
