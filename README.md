# Fatih Kalem — Masaüstü Sürüm

Windows için **şeffaf, her zaman üstte kalan bir çizim katmanı**. Akıllı tahtada kullanılan Fatih Kalem'in masaüstü yeniden yorumudur: ekranda açık olan sunum, PDF, video veya herhangi bir uygulamanın **üzerine** çizersiniz. Çizimler uygulamanın içinde değil, masaüstünün üzerinde durur.

> Bu proje resmî bir MEB uygulaması değildir. Web sürümünden bağımsız, aynı fikri taşıyan bir masaüstü uygulamasıdır.

## Ne yapar?

- Tam ekran, çerçevesiz, şeffaf bir pencere açar ve onu `screen-saver` seviyesinde her şeyin üstünde tutar.
- Ana ekranın tamamını (`screen.getPrimaryDisplay().bounds`) kaplar.
- **Çizim modu** açıkken fare/dokunmatik girişini yakalar; imleç artı işaretine dönüşür.
- **Tıklama geçir** modunda pencere fare olaylarını yok sayar (`setIgnoreMouseEvents(true, { forward: true })`). Böylece alttaki sunum, video veya uygulama normal şekilde kullanılır; çizimler görünür kalır.
- Üstteki araç şeridi kendi alanında durur. Çizim alanı ekranın geri kalanıdır; araç çubuğu çizim yüzeyini kapatmaz.

## Araçlar

- **Kalem:** 24 renk, 3 kalınlık (İnce / Orta / Kalın), yumuşatılmış serbest çizim.
- **Fosforlu:** Geniş, yarı saydam vurgulama. Çizim sırasında canlı önizleme gösterir.
- **Silgi:** Küçük ve büyük boy; `destination-out` ile gerçek silme.
- **Çizgi, Dikdörtgen, Elips:** Sürüklerken canlı önizleme.
- **Geri / Yinele:** En fazla 30 PNG anlık görüntüsü.
- **Tümünü sil:** Onay penceresiyle temizler; işlem geri alınabilir.
- **Perdele:** Ekranı karartır, içinde sürüklenebilir ve boyutlandırılabilir bir görüntü penceresi bırakır.
- **PNG:** Masaüstünün taze bir görüntüsünü çizim katmanıyla birleştirip kaydeder.

Web sürümündeki arayüz etiketleri korunmuştur: **Kalem, Fosforlu, Silgi, Çizgi, Dikdörtgen, Elips, Perdele, Tümünü sil, Geri, Yinele, PNG**.

## Klavye kısayolları

### Global kısayollar (uygulama odakta değilken de çalışır)

| Kısayol | İşlem |
| --- | --- |
| `Ctrl+Alt+K` | Çizim modu ile tıklama geçir modu arasında geçiş |
| `Ctrl+Alt+H` | Kaplamayı tamamen gizle / göster |
| `Ctrl+Alt+Q` | Uygulamadan çık |

### Uygulama içi kısayollar

| Tuş | İşlem |
| --- | --- |
| `P` | Kalem |
| `H` | Fosforlu |
| `E` | Silgi |
| `L` | Çizgi |
| `R` | Dikdörtgen |
| `O` | Elips |
| `U` | Geri al |
| `Ctrl+Z` | Geri al |
| `Ctrl+Y` | Yinele |
| `Ctrl+Shift+Z` | Yinele |
| `Esc` | Perdeyi, açık paneli veya devam eden çizimi kapat |

Perde penceresi odaktayken:

- **Yön tuşları:** perdeyi taşır.
- **Shift + yön tuşları:** perdeyi boyutlandırır.
- **Alt + yön tuşları:** daha büyük adımlarla taşır.

> Çizim modu kapalıyken pencere tıklamaları alttaki uygulamaya geçer. Araç çubuğuna yeniden erişmek için `Ctrl+Alt+K` kullanın.

## Çalıştırma

Gereken: Node.js ve npm.

```bash
npm install
npm start
```

`npm start`, Electron uygulamasını (`electron .`) başlatır. Uygulama açıldığında çizim modu açıktır ve pencere ana ekranın tamamını kaplar.

## Neden tarayıcıda olmuyor?

Bir web sayfası yalnızca kendi sekmesinin içine çizebilir. Tarayıcı güvenlik modeli şunları engeller:

- Sayfa dışında, diğer uygulamaların üzerinde duran **şeffaf ve çerçevesiz bir işletim sistemi penceresi** oluşturmak,
- O pencerenin **her zaman en üstte** kalmasını sağlamak,
- Pencereyi **fare olaylarını yok sayan** bir tıklama geçir katmanına dönüştürmek,
- Ekranın tamamını **canlı olarak** yakalayıp çizim katmanıyla birleştirmek.

Bunlar tarayıcı sekmesinin yetkisi dışındadır; OS seviyesinde bir pencere ve ana süreç gerekir. Electron, bu masaüstü yeteneklerini sağlar. Çizim motoru yine Canvas 2D'dir; fark, tuvalin diğer uygulamaların üzerinde duran şeffaf bir pencerede yaşamasıdır.

## PNG dışa aktarma

`PNG` düğmesine basıldığında:

1. Ana süreç kaplamayı kısa süreliğine gizler ve `desktopCapturer` ile ana ekranın taze bir görüntüsünü alır.
2. Renderer bu görüntüyü çizim tuvaliyle birleştirir.
3. PNG, yerel kaydetme penceresiyle diske yazılır.

Ekran görüntüsü alınamazsa uygulama hata vermez; **yalnızca çizim katmanını** şeffaf bir PNG olarak kaydeder ve bunu bir bildirimle söyler. Masaüstü yakalaması, o anda ekranda görünen diğer uygulamaları da içerir.

## Portable Windows derlemesi

`electron-builder` yapılandırması hazırdır. Portatif `.exe` üretmek için:

```bash
npm run build
```

Çıktı `dist/Fatih-Kalem-1.0.0-portable.exe` olarak oluşur. Derleme imzalama gerektirmez; Windows SmartScreen imzasız dosyalar için uyarı gösterebilir.

Bu depoda derleme komutu **çalıştırılmamıştır**; yalnızca yapılandırma eklenmiştir.

## Dosyalar

| Dosya | Açıklama |
| --- | --- |
| `main.js` | Pencere, global kısayollar, desktopCapturer, kaydetme diyaloğu, IPC |
| `preload.js` | `contextIsolation` altında küçük ve dar bir köprü API'si |
| `renderer/index.html` | Arayüz ve erişilebilir işaretleme |
| `renderer/styles.css` | Şeffaf kaplama, araç şeridi, paneller, perde |
| `renderer/app.js` | Canvas çizimi, geçmiş, perde, PNG birleştirme |
| `package.json` | Electron ve electron-builder yapılandırması |
| `README.md` | Bu belge |

## Sınırlamalar

- Çizimler kalıcı değildir; uygulama kapanınca temizlenir. Saklamak için PNG kullanın.
- Pencere yeniden boyutlandırılamaz. Ekran çözünürlüğü veya ölçek değişirse çizim geçmişi sıfırlanabilir.
- PNG yakalaması yalnızca **ana ekranı** alır; çoklu monitörde diğer ekranlar dışa aktarılmaz.
- Bazı uygulamalar `Ctrl+Alt+K` gibi global kısayolları kendisi için ayırmış olabilir. Kayıt başarısız olursa uygulama konsola uyarı yazar.
- Yüksek DPI ekranlarda tuval en fazla 2× cihaz pikseliyle çalışır.
- Uygulama imzasızdır; kurumsal ortamlarda yönetici onayı gerekebilir.

## Güvenlik notları

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Renderer'a yalnızca `getState`, `onModeChange`, `onVisibilityChange`, `captureScreen` ve `savePng` fonksiyonları açılır.
- IPC çağrıları yalnızca uygulamanın kendi `webContents`'inden kabul edilir.
- Gelen PNG verisi imza ve boyut açısından doğrulanır; dosya adı temizlenir.
- Renderer'da satır içi script yoktur; CSP tanımlıdır.
