# Kışla modeli

Buraya kommersiya istifadəsinə icazəli kışla modelini yerləşdirin:

- Fayl adı: `barracks.glb`
- Format: GLB 2.0 (tək fayl; mümkün olduqda teksturalar daxildə)
- Tövsiyə: modelin əsası (pivot) yer səviyyəsində olsun.
- Lisenziya: modelin müəllif və kommersiya istifadə icazəsini `LICENSE.txt` daxilində qeyd edin.

Model faylı hələ əlavə edilməyib. Buna görə oyunda mövcud procedural kışla dəyişdirilmir.


## Tapılmış model namizədi — Wolfhold Barracks

- Mənbə: https://literock-studios.itch.io/medieval-buildings-sampler
- Paketdəki model: Wolfhold Barracks
- Format: GLB (teksturalar faylın daxilində)
- Təxmini həndəsə: 10 min üçbucaq; LOD0–LOD2
- Görünüş: PBR teksturalı, daha detallı orta əsr binası
- Lisenziya: kommersiya və qeyri-kommersiya oyunlarında istifadəyə icazə verilir; modelin özünü ayrıca satmaq və ya yenidən yaymaq olmaz.
- Paket ölçüsü: 42 MB

### İnteqrasiya statusu

Bu model hazırkı oyunun xüsusi GLB oxuyucusuna birbaşa uyğun hesab edilmir: oxuyucu PBR teksturaları və LOD qruplarını tam emal etmir. Modeli oyuna salmazdan əvvəl material/tekstura uyğunlaşdırması və real brauzer testi lazımdır. Buna görə hazırkı kışla hələlik saxlanılır; model oyuna əlavə olunmayıb.


## Yüklənmiş GLB faylının texniki yoxlaması

GitHub Actions avtomatik yoxlaması uğurla tamamlandı.

- GLB 2.0 başlığı və fayl uzunluğu: keçdi
- Mesh: 3
- Primitive: 3
- Node: 3
- Material: 1
- Daxili şəkil: 3
- Texture: 3
- Təxmini həndəsə: 16 418 üçbucaq
- Normal və UV koordinatları: mövcuddur
- İlk mesh sərhədi: təxminən 17 × 11.2 × 16.9 vahid

**Nəticə:** fayl struktur baxımından sağlam GLB 2.0-dır. Lakin hazırkı oyun oxuyucusu daxili şəkilləri/teksturaları hələ göstərmir. Buna görə kazarmanı birbaşa aktivləşdirmək əvəzinə əvvəlcə tekstura dəstəyini əlavə etmək lazımdır. Model hələ oyunda aktiv deyil.
