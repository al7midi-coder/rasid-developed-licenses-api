/*!
 * Rasid — المحاضر التنسيقية: shared engine (UMD, no dependencies; browser global RasidCoordEngine / Node module.exports)
 * Seed templates are generated from the 5 Word templates by coord/seed/build-seed.py (do not edit the SEED block by hand).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RasidCoordEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /*SEED_START*/
  var SEED_JSON = [{"introSingle":{"head":"إشارةً إلى طلب إصدار رخصة الحفر رقم ({licenseNumber}) الواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض والمتضمن طلب تنفيذ أعمال {digLabel}{roadPart}{projectPart}{lengthPart} وفقاً للمخطط المرفق مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال شريطة التزام {contractor} بما يلي:"},"introMerged":{"head":"إشارةً إلى طلبات إصدار الرخص التالية:","row":"الرخصة رقم ({licenseNumber}) تنفيذ أعمال {digLabel}{roadPart}{lengthPart}.","body":"والواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض وذلك لتنفيذ أعمال {worksDescription} مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال، شريطة التزام {contractor} بما يلي:"},"status":"مرفوع","version":1,"active":true,"updatedAt":"2026-10-25T00:00:00.000Z","id":"T_GREEN","name":"محضر تنسيقي — الهيئة الملكية لمدينة الرياض – الرياض الخضراء","sourceFile":"t1.docx","ownerKey":"green_riyadh","ownerLabel":"الهيئة الملكية لمدينة الرياض – الرياض الخضراء","digTypes":["open"],"mode":"single","logos":{"right":"amana","left":"green-riyadh"},"header":{"kind":"logos","subtitle":"الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق"},"titlePattern":"محضر تنسيقي لأعمال {digTitle} ضمن نطاق الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق","showWorksRow":true,"showHijri":false,"clauses":[{"id":"T_GREEN:permits","templateId":"T_GREEN","key":"permits","number":1,"text":"يلتزم المقاول باستكمال جميع الإجراءات النظامية واستخراج تراخيص العمل اللازمة عبر مركز مشاريع البنية التحتية بمنطقة الرياض قبل البدء في تنفيذ الأعمال، وكما يلتزم بالتنسيق مع جميع الجهات ذات العلاقة بما يضمن تنفيذ الأعمال وفق الأنظمة والتعليمات المعتمدة.","bold":[],"enabled":true,"order":10,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GREEN:site","templateId":"T_GREEN","key":"site","number":2,"text":"يكون موقع العمل تحت مسؤولية المقاول طوال مدة الأعمال ويلتزم بالحفاظ على جميع الأصول والمرافق القائمة وعدم التسبب بأي ضرر لها ويتحمل كامل المسؤولية والتكاليف المالية المترتبة على أي أضرار تنجم عن أعماله كما يلتزم المقاول بالتبليغ الفوري للإدارة والجهات ذات العلاقة عن أي ضرر يحدث أثناء التنفيذ والبدء فوراً في اتخاذ الإجراءات اللازمة لمعالجته.","bold":[],"enabled":true,"order":20,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GREEN:drawings","templateId":"T_GREEN","key":"drawings","number":3,"text":"يلتزم المقاول بتنفيذ كافة الأعمال وفقا للمخططات المعتمدة من قِبل الجهة المالكة وبما يتوافق مع المواصفات والاشتراطات المعتمدة لدى أمانة منطقة الرياض.","bold":[],"enabled":true,"order":30,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GREEN:coordination","templateId":"T_GREEN","key":"coordination","number":4,"text":"يلتزم المقاول بالتنسيق المسبق والمستمر مع المختصين بالإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق، قبل وأثناء تنفيذ وبعد تنفيذ الأعمال وبما يضمن عدم التأثير على سلامة الطريق أو أصوله.","bold":[],"enabled":true,"order":40,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GREEN:traffic","templateId":"T_GREEN","key":"traffic","number":5,"text":"يلتزم المقاول خلال تنفيذ الأعمال بعدم التأثير على الحركة المرورية، كما يلتزم بوضع وسائل السلامة في المواقع الجاري العمل بها لحماية مستخدمي وسالكي الطريق، ووضع لوحات تعريفية عن المشروع بالموقع الجاري تنفيذ الأعمال به.","bold":[],"enabled":true,"order":50,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GREEN:incidents","templateId":"T_GREEN","key":"incidents","number":6,"text":"يلتزم المقاول بمعالجة جميع البلاغات والحوادث الناتجة عن أعماله الواقعة ضمن نطاق العمل أو المتأثرة بسبب أعماله بشكل فوري ومباشر.","bold":[],"enabled":true,"order":60,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GREEN:appearance","templateId":"T_GREEN","key":"appearance","number":7,"text":"يلتزم المقاول بالمحافظة على المظهر العام وعدم تشوين المواد وتجميع المخلفات في مناطق العمل وترحيلها مباشرة من مواقع العمل طوال مدة تنفيذ الأعمال.","bold":[],"enabled":true,"order":70,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GREEN:documents","templateId":"T_GREEN","key":"documents","number":8,"text":"يلتزم المقاول بإرفاق جميع المستندات والملفات المطلوبة بطلب الرخصة ومن ذلك على سبيل المثال لا الحصر: تعهد مصدق من الغرفة التجارية، صور الموقع موضحاً بها الإحداثيات، ملف (KMZ) لمسار الحفر، حصر الأصول القائمة بالموقع والتابعة للإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق موضحه على المخططات، مخططات (Shop Drawings) للعمل، وصورة من السجل التجاري للمقاول.","bold":[],"enabled":true,"order":80,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GREEN:hdd","templateId":"T_GREEN","key":"hdd","number":9,"text":"يلتزم المقاول عند تنفيذ أعمال الثقب الأفقي الموجه بإرفاق خطة تنفيذ تفصيلية للأعمال، تشمل موقع حفرة الانطلاق، موقع حفرة الاستقبال، مسار الثقب مقطع عرضي (Cross section)، قطر الثقب، عمق التغطية، نوع المرفق، طريقة السحب الخلفي، خطة السلامة، خطة التحكم المروري، وخطة إدارة سوائل الحفر ونواتجها. كما يلتزم المقاول بتنفيذ حفرة انطلاق وحفرة استقبال بأبعاد كافية لاستيعاب معدات التنفيذ واحتواء العائد من سوائل الحفر وبقايا حفريات التربة، على أن تكون مواقع الحفر خارج مسار الحركة المرورية لطريق الرئيسي، وألا تؤثر على جسم الطريق أو الأرصفة أو المرافق القائمة أو عناصر السلامة المرورية كما يضمن تحقيق وبعمق بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم.","bold":["الثقب الأفقي الموجه","بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم"],"enabled":true,"order":90,"applicableDigTypes":["*"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_GREEN:asphalt","templateId":"T_GREEN","key":"asphalt","number":10,"text":"يلتزم المقاول بأن يتم تنفيذ أعمال السفلتة والدهانات وإعادة الوضع من قبل مقاول معتمد لدى وكالة التشغيل والصيانة، وبما يتوافق مع المواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":100,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GREEN:restore","templateId":"T_GREEN","key":"restore","number":11,"text":"يلتزم المقاول بإعادة الموقع إلى ما كان عليه بعد الانتهاء من الأعمال طبقاً للدليل الشامل لأعمال البنية التحتية والصادر من قِبل وزارة البلديات والإسكان، مع اعتبار أن جميع الطرق التابعة للإدارة هي طرق رئيسية فئة (أ).","bold":["طرق رئيسية فئة (أ)"],"enabled":true,"order":110,"applicableDigTypes":["*"],"isMandatory":false,"layer":"owner","version":1},{"id":"T_GREEN:duration","templateId":"T_GREEN","key":"duration","number":12,"text":"يلتزم المقاول بتنفيذ الأعمال خلال مدة زمنية قدرها ({duration}) يوماً من تاريخ إصدار رخصة العمل، مع الالتزام بالتقيد بمدة الرخصة وعدم الاستمرار في الأعمال بعد انتهائها.","bold":[],"enabled":true,"order":120,"applicableDigTypes":["*"],"isMandatory":false,"layer":"owner","version":1},{"id":"T_GREEN:report","templateId":"T_GREEN","key":"report","number":13,"text":"يلتزم المقاول وبعد الانتهاء من تنفيذ الأعمال وقبل تقديم طلب إغلاق الرخصة بمراجعة الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق وتقديم تقرير فني متكامل يوضح جميع مراحل الأعمال المنفذة، مدعماً بالصور وتقارير نتائج الاختبارات المخبرية ذات العلاقة، على أن يكون التقرير معتمداً من الاستشاري المعين على الرخصة وذلك للتحقق من جودة وسلامة الأعمال ومطابقتها للمواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":130,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GREEN:repair","templateId":"T_GREEN","key":"repair","number":14,"text":"يلتزم المقاول بمعالجة وإصلاح جميع الأضرار أو العيوب أو الهبوطات أو التشققات أو أي خلل فني قد يظهر على الطريق أو الأرصفة أو أي من أصول الإدارة نتيجة الأعمال، سواء ظهر أثناء التنفيذ أو بعد الانتهاء منه أو بعد إغلاق الرخصة، وذلك طوال فترة الضمان المعتمدة من مركز مشاريع البنية التحتية بمنطقة الرياض.","bold":[],"enabled":true,"order":140,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GREEN:liability","templateId":"T_GREEN","key":"liability","number":15,"text":"في حال الإخلال بأي من الشروط أو الالتزامات الواردة في هذا المحضر، يتحمل المقاول والجهة المالكة والاستشاري – كلٌ فيما يخصه – كامل المسؤولية النظامية والفنية والمالية عن جميع الآثار والتبعات والأضرار الناتجة عن ذلك.","bold":[],"enabled":true,"order":150,"applicableDigTypes":["*"],"isMandatory":true,"layer":"owner","version":1}],"parties":[{"section":"owner","key":"contractor","row":0,"label":"ممثل المقاول"},{"section":"owner","key":"consultant","row":0,"label":"ممثل الإستشاري"},{"section":"owner","key":"owner","row":1,"label":"ممثل الهيئة الملكية لمدينة الرياض – الرياض الخضراء"},{"section":"amana","key":"electricity","row":0,"col":0,"title":"رئيس قسم الكهرباء بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"floods","row":0,"col":1,"title":"رئيس قسم السيول بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"roads","row":0,"col":2,"title":"رئيس قسم الطرق بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"manager","row":1,"col":0,"title":"مدير إدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"services","row":1,"col":2,"title":"مدير إدارة خدمات تشغيل وصيانة المحاور والجسور والأنفاق"}]},{"introSingle":{"head":"إشارةً إلى طلب إصدار رخصة الحفر رقم ({licenseNumber}) الواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض والمتضمن طلب تنفيذ أعمال {digLabel}{roadPart}{projectPart}{lengthPart} وفقاً للمخطط المرفق مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال شريطة التزام {contractor} بما يلي:"},"introMerged":{"head":"إشارةً إلى طلبات إصدار الرخص التالية:","row":"الرخصة رقم ({licenseNumber}) تنفيذ أعمال {digLabel}{roadPart}{lengthPart}.","body":"والواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض وذلك لتنفيذ أعمال {worksDescription} مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال، شريطة التزام {contractor} بما يلي:"},"status":"مرفوع","version":1,"active":true,"updatedAt":"2026-10-25T00:00:00.000Z","id":"T_RCRC","name":"محضر تنسيقي — الهيئة الملكية لمدينة الرياض","sourceFile":"t2.docx","ownerKey":"rcrc","ownerLabel":"الهيئة الملكية لمدينة الرياض","digTypes":["open","horizontal"],"mode":"both","logos":{"right":"amana","left":"rcrc"},"header":{"kind":"logos","subtitle":"الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق"},"titlePattern":"محضر تنسيقي لأعمال {digTitle} ضمن نطاق الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق","showWorksRow":true,"showHijri":false,"clauses":[{"id":"T_RCRC:permits","templateId":"T_RCRC","key":"permits","number":1,"text":"يلتزم المقاول باستكمال جميع الإجراءات النظامية واستخراج تراخيص العمل اللازمة عبر مركز مشاريع البنية التحتية بمنطقة الرياض قبل البدء في تنفيذ الأعمال، وكما يلتزم بالتنسيق مع جميع الجهات ذات العلاقة بما يضمن تنفيذ الأعمال وفق الأنظمة والتعليمات المعتمدة.","bold":[],"enabled":true,"order":10,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_RCRC:site","templateId":"T_RCRC","key":"site","number":2,"text":"يكون موقع العمل تحت مسؤولية المقاول طوال مدة الأعمال ويلتزم بالحفاظ على جميع الأصول والمرافق القائمة وعدم التسبب بأي ضرر لها ويتحمل كامل المسؤولية والتكاليف المالية المترتبة على أي أضرار تنجم عن أعماله كما يلتزم المقاول بالتبليغ الفوري للإدارة والجهات ذات العلاقة عن أي ضرر يحدث أثناء التنفيذ والبدء فوراً في اتخاذ الإجراءات اللازمة لمعالجته.","bold":[],"enabled":true,"order":20,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_RCRC:drawings","templateId":"T_RCRC","key":"drawings","number":3,"text":"يلتزم المقاول بتنفيذ كافة الأعمال وفقا للمخططات المعتمدة من قِبل الجهة المالكة وبما يتوافق مع المواصفات والاشتراطات المعتمدة لدى أمانة منطقة الرياض.","bold":[],"enabled":true,"order":30,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_RCRC:coordination","templateId":"T_RCRC","key":"coordination","number":4,"text":"يلتزم المقاول بالتنسيق المسبق والمستمر مع المختصين بالإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق، قبل وأثناء تنفيذ وبعد تنفيذ الأعمال وبما يضمن عدم التأثير على سلامة الطريق أو أصوله.","bold":[],"enabled":true,"order":40,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_RCRC:traffic","templateId":"T_RCRC","key":"traffic","number":5,"text":"يلتزم المقاول خلال تنفيذ الأعمال بعدم التأثير على الحركة المرورية، كما يلتزم بوضع وسائل السلامة في المواقع الجاري العمل بها لحماية مستخدمي وسالكي الطريق، ووضع لوحات تعريفية عن المشروع بالموقع الجاري تنفيذ الأعمال به.","bold":[],"enabled":true,"order":50,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_RCRC:incidents","templateId":"T_RCRC","key":"incidents","number":6,"text":"يلتزم المقاول بمعالجة جميع البلاغات والحوادث الناتجة عن أعماله الواقعة ضمن نطاق العمل أو المتأثرة بسبب أعماله بشكل فوري ومباشر.","bold":[],"enabled":true,"order":60,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_RCRC:appearance","templateId":"T_RCRC","key":"appearance","number":7,"text":"يلتزم المقاول بالمحافظة على المظهر العام وعدم تشوين المواد وتجميع المخلفات في مناطق العمل وترحيلها مباشرة من مواقع العمل طوال مدة تنفيذ الأعمال.","bold":[],"enabled":true,"order":70,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_RCRC:documents","templateId":"T_RCRC","key":"documents","number":8,"text":"يلتزم المقاول بإرفاق جميع المستندات والملفات المطلوبة بطلب الرخصة ومن ذلك على سبيل المثال لا الحصر: تعهد مصدق من الغرفة التجارية، صور الموقع موضحاً بها الإحداثيات، ملف (KMZ) لمسار الحفر، حصر الأصول القائمة بالموقع والتابعة للإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق موضحه على المخططات، مخططات (Shop Drawings) للعمل، وصورة من السجل التجاري للمقاول.","bold":[],"enabled":true,"order":80,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_RCRC:hdd","templateId":"T_RCRC","key":"hdd","number":9,"text":"يلتزم المقاول عند تنفيذ أعمال الثقب الأفقي الموجه بإرفاق خطة تنفيذ تفصيلية للأعمال، تشمل موقع حفرة الانطلاق، موقع حفرة الاستقبال، مسار الثقب مقطع عرضي (Cross section)، قطر الثقب، عمق التغطية، نوع المرفق، طريقة السحب الخلفي، خطة السلامة، خطة التحكم المروري، وخطة إدارة سوائل الحفر ونواتجها. كما يلتزم المقاول بتنفيذ حفرة انطلاق وحفرة استقبال بأبعاد كافية لاستيعاب معدات التنفيذ واحتواء العائد من سوائل الحفر وبقايا حفريات التربة، على أن تكون مواقع الحفر خارج مسار الحركة المرورية لطريق الرئيسي، وألا تؤثر على جسم الطريق أو الأرصفة أو المرافق القائمة أو عناصر السلامة المرورية كما يضمن تحقيق وبعمق بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم.","bold":["الثقب الأفقي الموجه","بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم"],"enabled":true,"order":90,"applicableDigTypes":["horizontal"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_RCRC:asphalt","templateId":"T_RCRC","key":"asphalt","number":10,"text":"يلتزم المقاول بأن يتم تنفيذ أعمال السفلتة والدهانات وإعادة الوضع من قبل مقاول معتمد لدى وكالة التشغيل والصيانة، وبما يتوافق مع المواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":100,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_RCRC:restore","templateId":"T_RCRC","key":"restore","number":11,"text":"يلتزم المقاول بإعادة الموقع إلى ما كان عليه بعد الانتهاء من الأعمال طبقاً للدليل الشامل لأعمال البنية التحتية والصادر من قِبل وزارة البلديات والإسكان، مع اعتبار أن جميع الطرق التابعة للإدارة هي طرق رئيسية فئة (أ).","bold":["طرق رئيسية فئة (أ)"],"enabled":true,"order":110,"applicableDigTypes":["*"],"isMandatory":false,"layer":"owner","version":1},{"id":"T_RCRC:duration","templateId":"T_RCRC","key":"duration","number":12,"text":"يلتزم المقاول بتنفيذ الأعمال خلال مدة زمنية قدرها ({duration}) يوماً من تاريخ إصدار رخصة العمل، مع الالتزام بالتقيد بمدة الرخصة وعدم الاستمرار في الأعمال بعد انتهائها.","bold":[],"enabled":true,"order":120,"applicableDigTypes":["*"],"isMandatory":false,"layer":"owner","version":1},{"id":"T_RCRC:report","templateId":"T_RCRC","key":"report","number":13,"text":"يلتزم المقاول وبعد الانتهاء من تنفيذ الأعمال وقبل تقديم طلب إغلاق الرخصة بمراجعة الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق وتقديم تقرير فني متكامل يوضح جميع مراحل الأعمال المنفذة، مدعماً بالصور وتقارير نتائج الاختبارات المخبرية ذات العلاقة، على أن يكون التقرير معتمداً من الاستشاري المعين على الرخصة وذلك للتحقق من جودة وسلامة الأعمال ومطابقتها للمواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":130,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_RCRC:repair","templateId":"T_RCRC","key":"repair","number":14,"text":"يلتزم المقاول بمعالجة وإصلاح جميع الأضرار أو العيوب أو الهبوطات أو التشققات أو أي خلل فني قد يظهر على الطريق أو الأرصفة أو أي من أصول الإدارة نتيجة الأعمال، سواء ظهر أثناء التنفيذ أو بعد الانتهاء منه أو بعد إغلاق الرخصة، وذلك طوال فترة الضمان المعتمدة من مركز مشاريع البنية التحتية بمنطقة الرياض.","bold":[],"enabled":true,"order":140,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_RCRC:liability","templateId":"T_RCRC","key":"liability","number":15,"text":"في حال الإخلال بأي من الشروط أو الالتزامات الواردة في هذا المحضر، يتحمل المقاول والجهة المالكة والاستشاري – كلٌ فيما يخصه – كامل المسؤولية النظامية والفنية والمالية عن جميع الآثار والتبعات والأضرار الناتجة عن ذلك.","bold":[],"enabled":true,"order":150,"applicableDigTypes":["*"],"isMandatory":true,"layer":"owner","version":1}],"parties":[{"section":"owner","key":"contractor","row":0,"label":"ممثل المقاول"},{"section":"owner","key":"consultant","row":0,"label":"ممثل الإستشاري"},{"section":"owner","key":"owner","row":1,"label":"ممثل الهيئة الملكية لمدينة الرياض"},{"section":"amana","key":"electricity","row":0,"col":0,"title":"رئيس قسم الكهرباء بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"floods","row":0,"col":1,"title":"رئيس قسم السيول بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"roads","row":0,"col":2,"title":"رئيس قسم الطرق بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"manager","row":1,"col":0,"title":"مدير إدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"services","row":1,"col":2,"title":"مدير إدارة خدمات تشغيل وصيانة المحاور والجسور والأنفاق"}]},{"introSingle":{"head":"إشارةً إلى طلب إصدار رخصة الحفر رقم ({licenseNumber}) الواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض والمتضمن طلب تنفيذ أعمال {digLabel}{roadPart}{projectPart}{lengthPart} وفقاً للمخطط المرفق مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال شريطة التزام {contractor} بما يلي:"},"introMerged":{"head":"إشارةً إلى طلبات إصدار الرخص التالية:","row":"الرخصة رقم ({licenseNumber}) تنفيذ أعمال {digLabel}{roadPart}{lengthPart}.","body":"والواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض وذلك لتنفيذ أعمال {worksDescription} مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال، شريطة التزام {contractor} بما يلي:"},"status":"مرفوع","version":1,"active":true,"updatedAt":"2026-10-25T00:00:00.000Z","id":"T_HDD_SINGLE","name":"محضر تنسيقي — ثقب أفقي (جهة مالكة أخرى)","sourceFile":"t3.docx","ownerKey":"generic","ownerLabel":"عام (جهة أخرى)","digTypes":["horizontal"],"mode":"single","logos":{"right":"amana","left":null},"header":{"kind":"logos","subtitle":"الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق"},"titlePattern":"محضر تنسيقي لأعمال {digTitle} ضمن نطاق الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق","showWorksRow":true,"showHijri":true,"clauses":[{"id":"T_HDD_SINGLE:permits","templateId":"T_HDD_SINGLE","key":"permits","number":1,"text":"يلتزم المقاول باستكمال جميع الإجراءات النظامية واستخراج تراخيص العمل اللازمة عبر مركز مشاريع البنية التحتية بمنطقة الرياض قبل البدء في تنفيذ الأعمال، وكما يلتزم بالتنسيق مع جميع الجهات ذات العلاقة بما يضمن تنفيذ الأعمال وفق الأنظمة والتعليمات المعتمدة.","bold":[],"enabled":true,"order":10,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_HDD_SINGLE:site","templateId":"T_HDD_SINGLE","key":"site","number":2,"text":"يكون موقع العمل تحت مسؤولية المقاول طوال مدة الأعمال ويلتزم بالحفاظ على جميع الأصول والمرافق القائمة وعدم التسبب بأي ضرر لها ويتحمل كامل المسؤولية والتكاليف المالية المترتبة على أي أضرار تنجم عن أعماله كما يلتزم المقاول بالتبليغ الفوري للإدارة والجهات ذات العلاقة عن أي ضرر يحدث أثناء التنفيذ والبدء فوراً في اتخاذ الإجراءات اللازمة لمعالجته.","bold":[],"enabled":true,"order":20,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_HDD_SINGLE:drawings","templateId":"T_HDD_SINGLE","key":"drawings","number":3,"text":"يلتزم المقاول بتنفيذ كافة الأعمال وفقا للمخططات المعتمدة من قِبل الجهة المالكة وبما يتوافق مع المواصفات والاشتراطات المعتمدة لدى أمانة منطقة الرياض.","bold":[],"enabled":true,"order":30,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_HDD_SINGLE:coordination","templateId":"T_HDD_SINGLE","key":"coordination","number":4,"text":"يلتزم المقاول بالتنسيق المسبق والمستمر مع المختصين بالإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق، قبل وأثناء تنفيذ وبعد تنفيذ الأعمال وبما يضمن عدم التأثير على سلامة الطريق أو أصوله.","bold":[],"enabled":true,"order":40,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_HDD_SINGLE:traffic","templateId":"T_HDD_SINGLE","key":"traffic","number":5,"text":"يلتزم المقاول خلال تنفيذ الأعمال بعدم التأثير على الحركة المرورية، كما يلتزم بوضع وسائل السلامة في المواقع الجاري العمل بها لحماية مستخدمي وسالكي الطريق، ووضع لوحات تعريفية عن المشروع بالموقع الجاري تنفيذ الأعمال به.","bold":[],"enabled":true,"order":50,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_HDD_SINGLE:incidents","templateId":"T_HDD_SINGLE","key":"incidents","number":6,"text":"يلتزم المقاول بمعالجة جميع البلاغات والحوادث الناتجة عن أعماله الواقعة ضمن نطاق العمل أو المتأثرة بسبب أعماله بشكل فوري ومباشر.","bold":[],"enabled":true,"order":60,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_HDD_SINGLE:appearance","templateId":"T_HDD_SINGLE","key":"appearance","number":7,"text":"يلتزم المقاول بالمحافظة على المظهر العام وعدم تشوين المواد وتجميع المخلفات في مناطق العمل وترحيلها مباشرة من مواقع العمل طوال مدة تنفيذ الأعمال.","bold":[],"enabled":true,"order":70,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_HDD_SINGLE:documents","templateId":"T_HDD_SINGLE","key":"documents","number":8,"text":"يلتزم المقاول بإرفاق جميع المستندات والملفات المطلوبة بطلب الرخصة ومن ذلك على سبيل المثال لا الحصر: تعهد مصدق من الغرفة التجارية، صور الموقع موضحاً بها الإحداثيات، ملف (KMZ) لمسار الحفر، حصر الأصول القائمة بالموقع والتابعة للإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق موضحه على المخططات، مخططات (Shop Drawings) للعمل، وصورة من السجل التجاري للمقاول.","bold":[],"enabled":true,"order":80,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_HDD_SINGLE:hdd","templateId":"T_HDD_SINGLE","key":"hdd","number":9,"text":"يلتزم المقاول عند تنفيذ أعمال الثقب الأفقي الموجه بإرفاق خطة تنفيذ تفصيلية للأعمال، تشمل موقع حفرة الانطلاق، موقع حفرة الاستقبال، مسار الثقب مقطع عرضي (Cross section)، قطر الثقب، عمق التغطية، نوع المرفق، طريقة السحب الخلفي، خطة السلامة، خطة التحكم المروري، وخطة إدارة سوائل الحفر ونواتجها. كما يلتزم المقاول بتنفيذ حفرة انطلاق وحفرة استقبال بأبعاد كافية لاستيعاب معدات التنفيذ واحتواء العائد من سوائل الحفر وبقايا حفريات التربة، على أن تكون مواقع الحفر خارج مسار الحركة المرورية لطريق الرئيسي، وألا تؤثر على جسم الطريق أو الأرصفة أو المرافق القائمة أو عناصر السلامة المرورية كما يضمن تحقيق وبعمق بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم.","bold":["الثقب الأفقي الموجه","بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم"],"enabled":true,"order":90,"applicableDigTypes":["horizontal"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_HDD_SINGLE:shoring","templateId":"T_HDD_SINGLE","key":"shoring","number":10,"text":"يلتزم المقاول في الحفر المفتوح بتدعيم جوانب الحفر في الطرق المرصوفة إذا زاد عمق الحفر عن 1.20 م، أو تنفيذ ميول لجوانب الحفر في الطرق غير المرصوفة حسب التصميم المعتمد.","bold":[],"enabled":true,"order":100,"applicableDigTypes":["open"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_HDD_SINGLE:straight","templateId":"T_HDD_SINGLE","key":"straight","number":11,"text":"يلتزم المقاول في الحفر المفتوح والحفر الدقيق بأن يكون مسار المرفق في خط مستقيم، موازيًا لمحور الطريق أو عموديًا عليه، مع التأكد من أن طبقة الأساس من مواد متماسكة بطول مسار الحفرية، وفي حال عدم تحقق ذلك يتم تعديل المسار بعد مراجعة المختصين بالإدارة، نظرًا لأن إصلاح الطريق غير ممكن لصغر أعماق الحفر.","bold":[],"enabled":true,"order":110,"applicableDigTypes":["open","micro"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_HDD_SINGLE:micro","templateId":"T_HDD_SINGLE","key":"micro","number":12,"text":"يلتزم المقاول في الحفر الدقيق بملء كامل الخندق بخرسانة معتمدة دون فراغات، بمقاس ركام 1–2 سم، ومحتوى أسمنت لا يقل عن 250 كجم/م³، ومقاومة 3–5 ميجا باسكال بعد 28 يومًا، وكثافة 1800–2000 كجم/م³ وهبوط بحسب التصميم من 15–20 سم ، وذلك لضمان دك الخرسانة ذاتياً.","bold":[],"enabled":true,"order":120,"applicableDigTypes":["micro"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_HDD_SINGLE:asphalt","templateId":"T_HDD_SINGLE","key":"asphalt","number":13,"text":"يلتزم المقاول بأن يتم تنفيذ أعمال السفلتة والدهانات وإعادة الوضع من قبل مقاول معتمد لدى وكالة التشغيل والصيانة، وبما يتوافق مع المواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":130,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_HDD_SINGLE:backfill","templateId":"T_HDD_SINGLE","key":"backfill","number":14,"text":"يلتزم المقاول بأعمال إعادة الردم وإعادة الرصف الاسفلتي بكامل عرض الحارات المتأثرة طبقًا للمواصفات الواردة في الدليل الشامل للأعمال المدنية للبنية التحتية – وزارة البلديات والإسكان، مع اعتبار أن جميع الطرق التابعة للإدارة هي طرق رئيسية فئة (أ).","bold":[],"enabled":true,"order":140,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_HDD_SINGLE:duration","templateId":"T_HDD_SINGLE","key":"duration","number":15,"text":"يلتزم المقاول بتنفيذ الأعمال خلال مدة زمنية قدرها ({duration}) يوماً من تاريخ إصدار رخصة العمل، مع الالتزام بالتقيد بمدة الرخصة وعدم الاستمرار في الأعمال بعد انتهائها.","bold":[],"enabled":true,"order":150,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_HDD_SINGLE:report","templateId":"T_HDD_SINGLE","key":"report","number":16,"text":"يلتزم المقاول وبعد الانتهاء من تنفيذ الأعمال وقبل تقديم طلب إغلاق الرخصة بمراجعة الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق وتقديم تقرير فني متكامل يوضح جميع مراحل الأعمال المنفذة، مدعماً بالصور وتقارير نتائج الاختبارات المخبرية ذات العلاقة، على أن يكون التقرير معتمداً من الاستشاري المعين على الرخصة وذلك للتحقق من جودة وسلامة الأعمال ومطابقتها للمواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":160,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_HDD_SINGLE:repair","templateId":"T_HDD_SINGLE","key":"repair","number":17,"text":"يلتزم المقاول بمعالجة وإصلاح جميع الأضرار أو العيوب أو الهبوطات أو التشققات أو أي خلل فني قد يظهر على الطريق أو الأرصفة أو أي من أصول الإدارة نتيجة الأعمال، سواء ظهر أثناء التنفيذ أو بعد الانتهاء منه أو بعد إغلاق الرخصة، وذلك طوال فترة الضمان المعتمدة من مركز مشاريع البنية التحتية بمنطقة الرياض.","bold":[],"enabled":true,"order":170,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_HDD_SINGLE:liability","templateId":"T_HDD_SINGLE","key":"liability","number":18,"text":"في حال الإخلال بأي من الشروط أو الالتزامات الواردة في هذا المحضر، يتحمل المقاول كامل المسؤولية النظامية والفنية والمالية عن جميع الآثار والتبعات والأضرار الناتجة عن ذلك.","bold":[],"enabled":true,"order":180,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1}],"parties":[{"section":"owner","key":"contractor","row":0,"label":"ممثل المقاول"},{"section":"owner","key":"consultant","row":0,"label":"ممثل الإستشاري"},{"section":"owner","key":"owner","row":1,"label":"ممثل الجهة المالكة"},{"section":"amana","key":"electricity","row":0,"col":0,"title":"رئيس قسم الكهرباء بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"floods","row":0,"col":1,"title":"رئيس قسم السيول بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"roads","row":0,"col":2,"title":"رئيس قسم الطرق بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"manager","row":1,"col":0,"title":"مدير إدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"services","row":1,"col":2,"title":"مدير إدارة خدمات تشغيل وصيانة المحاور والجسور والأنفاق"}]},{"introSingle":{"head":"إشارةً إلى طلب إصدار رخصة الحفر رقم ({licenseNumber}) الواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض والمتضمن طلب تنفيذ أعمال {digLabel}{roadPart}{projectPart}{lengthPart} وفقاً للمخطط المرفق مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال شريطة التزام {contractor} بما يلي:"},"introMerged":{"head":"إشارةً إلى طلبات إصدار الرخص التالية:","row":"الرخصة رقم ({licenseNumber}) تنفيذ أعمال {digLabel}{roadPart}{lengthPart}.","body":"والواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض وذلك لتنفيذ أعمال {worksDescription} مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال، شريطة التزام {contractor} بما يلي:"},"status":"مرفوع","version":1,"active":true,"updatedAt":"2026-10-25T00:00:00.000Z","id":"T_GENERIC","name":"محضر تنسيقي — النموذج العام","sourceFile":"t4.docx","ownerKey":"generic","ownerLabel":"عام","digTypes":["open","horizontal","micro"],"mode":"single","logos":{"right":"amana","left":null},"header":{"kind":"logos","subtitle":"الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق"},"titlePattern":"محضر تنسيقي لأعمال {digTitle} ضمن نطاق الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق","showWorksRow":true,"showHijri":false,"clauses":[{"id":"T_GENERIC:permits","templateId":"T_GENERIC","key":"permits","number":1,"text":"يلتزم المقاول باستكمال جميع الإجراءات النظامية واستخراج تراخيص العمل اللازمة عبر مركز مشاريع البنية التحتية بمنطقة الرياض قبل البدء في تنفيذ الأعمال، وكما يلتزم بالتنسيق مع جميع الجهات ذات العلاقة بما يضمن تنفيذ الأعمال وفق الأنظمة والتعليمات المعتمدة.","bold":[],"enabled":true,"order":10,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC:site","templateId":"T_GENERIC","key":"site","number":2,"text":"يكون موقع العمل تحت مسؤولية المقاول طوال مدة الأعمال ويلتزم بالحفاظ على جميع الأصول والمرافق القائمة وعدم التسبب بأي ضرر لها ويتحمل كامل المسؤولية والتكاليف المالية المترتبة على أي أضرار تنجم عن أعماله كما يلتزم المقاول بالتبليغ الفوري للإدارة والجهات ذات العلاقة عن أي ضرر يحدث أثناء التنفيذ والبدء فوراً في اتخاذ الإجراءات اللازمة لمعالجته.","bold":[],"enabled":true,"order":20,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC:drawings","templateId":"T_GENERIC","key":"drawings","number":3,"text":"يلتزم المقاول بتنفيذ كافة الأعمال وفقا للمخططات المعتمدة من قِبل الجهة المالكة وبما يتوافق مع المواصفات والاشتراطات المعتمدة لدى أمانة منطقة الرياض.","bold":[],"enabled":true,"order":30,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC:coordination","templateId":"T_GENERIC","key":"coordination","number":4,"text":"يلتزم المقاول بالتنسيق المسبق والمستمر مع المختصين بالإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق، قبل وأثناء تنفيذ وبعد تنفيذ الأعمال وبما يضمن عدم التأثير على سلامة الطريق أو أصوله.","bold":[],"enabled":true,"order":40,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC:traffic","templateId":"T_GENERIC","key":"traffic","number":5,"text":"يلتزم المقاول خلال تنفيذ الأعمال بعدم التأثير على الحركة المرورية، كما يلتزم بوضع وسائل السلامة في المواقع الجاري العمل بها لحماية مستخدمي وسالكي الطريق، ووضع لوحات تعريفية عن المشروع بالموقع الجاري تنفيذ الأعمال به.","bold":[],"enabled":true,"order":50,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC:incidents","templateId":"T_GENERIC","key":"incidents","number":6,"text":"يلتزم المقاول بمعالجة جميع البلاغات والحوادث الناتجة عن أعماله الواقعة ضمن نطاق العمل أو المتأثرة بسبب أعماله بشكل فوري ومباشر.","bold":[],"enabled":true,"order":60,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC:appearance","templateId":"T_GENERIC","key":"appearance","number":7,"text":"يلتزم المقاول بالمحافظة على المظهر العام وعدم تشوين المواد وتجميع المخلفات في مناطق العمل وترحيلها مباشرة من مواقع العمل طوال مدة تنفيذ الأعمال.","bold":[],"enabled":true,"order":70,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC:documents","templateId":"T_GENERIC","key":"documents","number":8,"text":"يلتزم المقاول بإرفاق جميع المستندات والملفات المطلوبة بطلب الرخصة ومن ذلك على سبيل المثال لا الحصر: تعهد مصدق من الغرفة التجارية، صور الموقع موضحاً بها الإحداثيات، ملف (KMZ) لمسار الحفر، حصر الأصول القائمة بالموقع والتابعة للإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق موضحه على المخططات، مخططات (Shop Drawings) للعمل، وصورة من السجل التجاري للمقاول.","bold":[],"enabled":true,"order":80,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC:hdd","templateId":"T_GENERIC","key":"hdd","number":9,"text":"يلتزم المقاول عند تنفيذ أعمال الثقب الأفقي الموجه بإرفاق خطة تنفيذ تفصيلية للأعمال، تشمل موقع حفرة الانطلاق، موقع حفرة الاستقبال، مسار الثقب مقطع عرضي (Cross section)، قطر الثقب، عمق التغطية، نوع المرفق، طريقة السحب الخلفي، خطة السلامة، خطة التحكم المروري، وخطة إدارة سوائل الحفر ونواتجها. كما يلتزم المقاول بتنفيذ حفرة انطلاق وحفرة استقبال بأبعاد كافية لاستيعاب معدات التنفيذ واحتواء العائد من سوائل الحفر وبقايا حفريات التربة، على أن تكون مواقع الحفر خارج مسار الحركة المرورية لطريق الرئيسي، وألا تؤثر على جسم الطريق أو الأرصفة أو المرافق القائمة أو عناصر السلامة المرورية كما يضمن تحقيق وبعمق بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم.","bold":["الثقب الأفقي الموجه","بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم"],"enabled":true,"order":90,"applicableDigTypes":["horizontal"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_GENERIC:shoring","templateId":"T_GENERIC","key":"shoring","number":10,"text":"يلتزم المقاول في الحفر المفتوح بتدعيم جوانب الحفر في الطرق المرصوفة إذا زاد عمق الحفر عن 1.20 م، أو تنفيذ ميول لجوانب الحفر في الطرق غير المرصوفة حسب التصميم المعتمد.","bold":[],"enabled":true,"order":100,"applicableDigTypes":["open"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_GENERIC:straight","templateId":"T_GENERIC","key":"straight","number":11,"text":"يلتزم المقاول في الحفر المفتوح والحفر الدقيق بأن يكون مسار المرفق في خط مستقيم، موازيًا لمحور الطريق أو عموديًا عليه، مع التأكد من أن طبقة الأساس من مواد متماسكة بطول مسار الحفرية، وفي حال عدم تحقق ذلك يتم تعديل المسار بعد مراجعة المختصين بالإدارة، نظرًا لأن إصلاح الطريق غير ممكن لصغر أعماق الحفر.","bold":[],"enabled":true,"order":110,"applicableDigTypes":["open","micro"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_GENERIC:micro","templateId":"T_GENERIC","key":"micro","number":12,"text":"يلتزم المقاول في الحفر الدقيق بملء كامل الخندق بخرسانة معتمدة دون فراغات، بمقاس ركام 1–2 سم، ومحتوى أسمنت لا يقل عن 250 كجم/م³، ومقاومة 3–5 ميجا باسكال بعد 28 يومًا، وكثافة 1800–2000 كجم/م³ وهبوط بحسب التصميم من 15–20 سم ، وذلك لضمان دك الخرسانة ذاتياً.","bold":[],"enabled":true,"order":120,"applicableDigTypes":["micro"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_GENERIC:asphalt","templateId":"T_GENERIC","key":"asphalt","number":13,"text":"يلتزم المقاول بأن يتم تنفيذ أعمال السفلتة والدهانات وإعادة الوضع من قبل مقاول معتمد لدى وكالة التشغيل والصيانة، وبما يتوافق مع المواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":130,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC:backfill","templateId":"T_GENERIC","key":"backfill","number":14,"text":"يلتزم المقاول بأعمال إعادة الردم وإعادة الرصف الاسفلتي بكامل عرض الحارات المتأثرة طبقًا للمواصفات الواردة في الدليل الشامل للأعمال المدنية للبنية التحتية – وزارة البلديات والإسكان، مع اعتبار أن جميع الطرق التابعة للإدارة هي طرق رئيسية فئة (أ).","bold":[],"enabled":true,"order":140,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC:duration","templateId":"T_GENERIC","key":"duration","number":15,"text":"يلتزم المقاول بتنفيذ الأعمال خلال مدة زمنية قدرها ({duration}) يوماً من تاريخ إصدار رخصة العمل، مع الالتزام بالتقيد بمدة الرخصة وعدم الاستمرار في الأعمال بعد انتهائها.","bold":[],"enabled":true,"order":150,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC:report","templateId":"T_GENERIC","key":"report","number":16,"text":"يلتزم المقاول وبعد الانتهاء من تنفيذ الأعمال وقبل تقديم طلب إغلاق الرخصة بمراجعة الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق وتقديم تقرير فني متكامل يوضح جميع مراحل الأعمال المنفذة، مدعماً بالصور وتقارير نتائج الاختبارات المخبرية ذات العلاقة، على أن يكون التقرير معتمداً من الاستشاري المعين على الرخصة وذلك للتحقق من جودة وسلامة الأعمال ومطابقتها للمواصفات والاشتراطات المعتمدة.","bold":["بمراجعة الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق","قبل تقديم طلب إغلاق الرخصة","وتقديم تقرير فني متكامل"],"enabled":true,"order":160,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC:repair","templateId":"T_GENERIC","key":"repair","number":17,"text":"يلتزم المقاول بمعالجة وإصلاح جميع الأضرار أو العيوب أو الهبوطات أو التشققات أو أي خلل فني قد يظهر على الطريق أو الأرصفة أو أي من أصول الإدارة نتيجة الأعمال، سواء ظهر أثناء التنفيذ أو بعد الانتهاء منه أو بعد إغلاق الرخصة، وذلك طوال فترة الضمان المعتمدة من مركز مشاريع البنية التحتية بمنطقة الرياض.","bold":[],"enabled":true,"order":170,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC:liability","templateId":"T_GENERIC","key":"liability","number":18,"text":"في حال الإخلال بأي من الشروط أو الالتزامات الواردة في هذا المحضر، يتحمل المقاول والجهة المالكة والاستشاري – كلٌ فيما يخصه – كامل المسؤولية النظامية والفنية والمالية عن جميع الآثار والتبعات والأضرار الناتجة عن ذلك.","bold":[],"enabled":true,"order":180,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1}],"parties":[{"section":"owner","key":"contractor","row":0,"label":"ممثل المقاول"},{"section":"owner","key":"consultant","row":0,"label":"ممثل الإستشاري"},{"section":"owner","key":"owner","row":1,"label":"ممثل الجهة المالكة"},{"section":"amana","key":"electricity","row":0,"col":0,"title":"رئيس قسم الكهرباء بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"floods","row":0,"col":1,"title":"رئيس قسم السيول بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"roads","row":0,"col":2,"title":"رئيس قسم الطرق بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"manager","row":1,"col":0,"title":"مدير إدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"services","row":1,"col":2,"title":"مدير إدارة خدمات تشغيل وصيانة المحاور والجسور والأنفاق"}]},{"introSingle":{"head":"إشارةً إلى طلب إصدار رخصة الحفر رقم ({licenseNumber}) الواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض والمتضمن طلب تنفيذ أعمال {digLabel}{roadPart}{projectPart}{lengthPart} وفقاً للمخطط المرفق مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال شريطة التزام {contractor} بما يلي:"},"introMerged":{"head":"إشارةً إلى طلبات إصدار الرخص التالية:","row":"الرخصة رقم ({licenseNumber}) تنفيذ أعمال {digLabel}{roadPart}{lengthPart}.","body":"والواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض وذلك لتنفيذ أعمال {worksDescription} مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال، شريطة التزام {contractor} بما يلي:"},"status":"مرفوع","version":1,"active":true,"updatedAt":"2026-10-25T00:00:00.000Z","id":"T_GENERIC_MERGED","name":"محضر تنسيقي مدمج — النموذج العام","sourceFile":"t5.docx","ownerKey":"generic","ownerLabel":"عام","digTypes":["open","horizontal","micro"],"mode":"merged","logos":{"right":"amana-crest","left":null},"header":{"kind":"crest","crestText":["أمانة منطقة الرياض","وكالة التشغيل والصيانة"]},"titlePattern":"محضر تنسيقي لتنفيذ أعمال حفر ({digList})","showWorksRow":false,"showHijri":true,"clauses":[{"id":"T_GENERIC_MERGED:permits","templateId":"T_GENERIC_MERGED","key":"permits","number":1,"text":"يلتزم المقاول باستكمال جميع الإجراءات النظامية واستخراج تراخيص العمل اللازمة عبر مركز مشاريع البنية التحتية بمنطقة الرياض قبل البدء في تنفيذ الأعمال، وكما يلتزم بالتنسيق مع جميع الجهات ذات العلاقة بما يضمن تنفيذ الأعمال وفق الأنظمة والتعليمات المعتمدة.","bold":[],"enabled":true,"order":10,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:site","templateId":"T_GENERIC_MERGED","key":"site","number":2,"text":"يكون موقع العمل تحت مسؤولية المقاول طوال مدة الأعمال ويلتزم بالحفاظ على جميع الأصول والمرافق القائمة وعدم التسبب بأي ضرر لها ويتحمل كامل المسؤولية والتكاليف المالية المترتبة على أي أضرار تنجم عن أعماله كما يلتزم المقاول بالتبليغ الفوري للإدارة والجهات ذات العلاقة عن أي ضرر يحدث أثناء التنفيذ والبدء فوراً في اتخاذ الإجراءات اللازمة لمعالجته.","bold":[],"enabled":true,"order":20,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:drawings","templateId":"T_GENERIC_MERGED","key":"drawings","number":3,"text":"يلتزم المقاول بتنفيذ كافة الأعمال وفقا للمخططات المعتمدة من قِبل الجهة المالكة وبما يتوافق مع المواصفات والاشتراطات المعتمدة لدى أمانة منطقة الرياض.","bold":[],"enabled":true,"order":30,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:coordination","templateId":"T_GENERIC_MERGED","key":"coordination","number":4,"text":"يلتزم المقاول بالتنسيق المسبق والمستمر مع المختصين بالإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق، قبل وأثناء تنفيذ وبعد تنفيذ الأعمال وبما يضمن عدم التأثير على سلامة الطريق أو أصوله.","bold":[],"enabled":true,"order":40,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:traffic","templateId":"T_GENERIC_MERGED","key":"traffic","number":5,"text":"يلتزم المقاول خلال تنفيذ الأعمال بعدم التأثير على الحركة المرورية، كما يلتزم بوضع وسائل السلامة في المواقع الجاري العمل بها لحماية مستخدمي وسالكي الطريق، ووضع لوحات تعريفية عن المشروع بالموقع الجاري تنفيذ الأعمال به.","bold":[],"enabled":true,"order":50,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:incidents","templateId":"T_GENERIC_MERGED","key":"incidents","number":6,"text":"يلتزم المقاول بمعالجة جميع البلاغات والحوادث الناتجة عن أعماله الواقعة ضمن نطاق العمل أو المتأثرة بسبب أعماله بشكل فوري ومباشر.","bold":[],"enabled":true,"order":60,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:appearance","templateId":"T_GENERIC_MERGED","key":"appearance","number":7,"text":"يلتزم المقاول بالمحافظة على المظهر العام وعدم تشوين المواد وتجميع المخلفات في مناطق العمل وترحيلها مباشرة من مواقع العمل طوال مدة تنفيذ الأعمال.","bold":[],"enabled":true,"order":70,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:documents","templateId":"T_GENERIC_MERGED","key":"documents","number":8,"text":"يلتزم المقاول بإرفاق جميع المستندات والملفات المطلوبة بطلب الرخصة ومن ذلك على سبيل المثال لا الحصر: تعهد مصدق من الغرفة التجارية، صور الموقع موضحاً بها الإحداثيات، ملف (KMZ) لمسار الحفر، حصر الأصول القائمة بالموقع والتابعة للإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق موضحه على المخططات، مخططات (Shop Drawings) للعمل، وصورة من السجل التجاري للمقاول.","bold":[],"enabled":true,"order":80,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:hdd","templateId":"T_GENERIC_MERGED","key":"hdd","number":9,"text":"يلتزم المقاول عند تنفيذ أعمال الثقب الأفقي الموجه بإرفاق خطة تنفيذ تفصيلية للأعمال، تشمل موقع حفرة الانطلاق، موقع حفرة الاستقبال، مسار الثقب مقطع عرضي (Cross section)، قطر الثقب، عمق التغطية، نوع المرفق، طريقة السحب الخلفي، خطة السلامة، خطة التحكم المروري، وخطة إدارة سوائل الحفر ونواتجها. كما يلتزم المقاول بتنفيذ حفرة انطلاق وحفرة استقبال بأبعاد كافية لاستيعاب معدات التنفيذ واحتواء العائد من سوائل الحفر وبقايا حفريات التربة، على أن تكون مواقع الحفر خارج مسار الحركة المرورية لطريق الرئيسي، وألا تؤثر على جسم الطريق أو الأرصفة أو المرافق القائمة أو عناصر السلامة المرورية كما يضمن تحقيق وبعمق بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم.","bold":["الثقب الأفقي الموجه","بتحقيق عمق تغطية لا يقل عن 5 م من منسوب سطح الطريق القائم"],"enabled":true,"order":90,"applicableDigTypes":["horizontal"],"isMandatory":false,"layer":"dig","version":1},{"id":"T_GENERIC_MERGED:asphalt","templateId":"T_GENERIC_MERGED","key":"asphalt","number":10,"text":"يلتزم المقاول بأن يتم تنفيذ أعمال السفلتة والدهانات وإعادة الوضع من قبل مقاول معتمد لدى وكالة التشغيل والصيانة، وبما يتوافق مع المواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":100,"applicableDigTypes":["*"],"isMandatory":false,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:restore","templateId":"T_GENERIC_MERGED","key":"restore","number":11,"text":"يلتزم المقاول بإعادة الموقع إلى ما كان عليه بعد الانتهاء من الأعمال طبقاً للدليل الشامل لأعمال البنية التحتية والصادر من قِبل وزارة البلديات والإسكان، مع اعتبار أن جميع الطرق التابعة للإدارة هي طرق رئيسية فئة (أ).","bold":["طرق رئيسية فئة (أ)"],"enabled":true,"order":110,"applicableDigTypes":["*"],"isMandatory":false,"layer":"merged","version":1},{"id":"T_GENERIC_MERGED:duration","templateId":"T_GENERIC_MERGED","key":"duration","number":12,"text":"يلتزم المقاول بتنفيذ الأعمال خلال مدة زمنية قدرها ({duration}) يوماً من تاريخ إصدار رخصة العمل، مع الالتزام بالتقيد بمدة الرخصة وعدم الاستمرار في الأعمال بعد انتهائها.","bold":[],"enabled":true,"order":120,"applicableDigTypes":["*"],"isMandatory":false,"layer":"merged","version":1},{"id":"T_GENERIC_MERGED:report","templateId":"T_GENERIC_MERGED","key":"report","number":13,"text":"يلتزم المقاول وبعد الانتهاء من تنفيذ الأعمال وقبل تقديم طلب إغلاق الرخصة بمراجعة الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق وتقديم تقرير فني متكامل يوضح جميع مراحل الأعمال المنفذة، مدعماً بالصور وتقارير نتائج الاختبارات المخبرية ذات العلاقة، على أن يكون التقرير معتمداً من الاستشاري المعين على الرخصة وذلك للتحقق من جودة وسلامة الأعمال ومطابقتها للمواصفات والاشتراطات المعتمدة.","bold":[],"enabled":true,"order":130,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:repair","templateId":"T_GENERIC_MERGED","key":"repair","number":14,"text":"يلتزم المقاول بمعالجة وإصلاح جميع الأضرار أو العيوب أو الهبوطات أو التشققات أو أي خلل فني قد يظهر على الطريق أو الأرصفة أو أي من أصول الإدارة نتيجة الأعمال، سواء ظهر أثناء التنفيذ أو بعد الانتهاء منه أو بعد إغلاق الرخصة، وذلك طوال فترة الضمان المعتمدة من مركز مشاريع البنية التحتية بمنطقة الرياض.","bold":[],"enabled":true,"order":140,"applicableDigTypes":["*"],"isMandatory":true,"layer":"base","version":1},{"id":"T_GENERIC_MERGED:liability","templateId":"T_GENERIC_MERGED","key":"liability","number":15,"text":"في حال الإخلال بأي من الشروط أو الالتزامات الواردة في هذا المحضر، يتحمل المقاول والجهة المالكة والاستشاري – كلٌ فيما يخصه – كامل المسؤولية النظامية والفنية والمالية عن جميع الآثار والتبعات والأضرار الناتجة عن ذلك.","bold":[],"enabled":true,"order":150,"applicableDigTypes":["*"],"isMandatory":true,"layer":"merged","version":1}],"parties":[{"section":"owner","key":"contractor","row":0,"label":"ممثل المقاول"},{"section":"owner","key":"owner","row":0,"label":"ممثل الجهة المالكة"},{"section":"amana","key":"electricity","row":0,"col":0,"title":"رئيس قسم الكهرباء بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"floods","row":0,"col":1,"title":"رئيس قسم السيول بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"roads","row":0,"col":2,"title":"رئيس قسم الطرق بإدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"manager","row":1,"col":0,"title":"مدير إدارة تشغيل وصيانة {dept}"},{"section":"amana","key":"services","row":1,"col":2,"title":"مدير إدارة خدمات تشغيل وصيانة المحاور والجسور والأنفاق"}]},{"introSingle":{"head":"إشارةً إلى طلب إصدار رخصة الحفر رقم ({licenseNumber}) الواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض والمتضمن طلب تنفيذ أعمال {digLabel}{roadPart}{projectPart}{lengthPart} وفقاً للمخطط المرفق مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال شريطة التزام {contractor} بما يلي:"},"introMerged":{"head":"إشارةً إلى طلبات إصدار الرخص التالية:","row":"الرخصة رقم ({licenseNumber}) تنفيذ أعمال {digLabel}{roadPart}{lengthPart}.","body":"والواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض وذلك لتنفيذ أعمال {worksDescription} مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال، شريطة التزام {contractor} بما يلي:"},"status":"غير مرفوع","version":1,"active":true,"updatedAt":"2026-10-25T00:00:00.000Z","id":"T_MASAR","name":"محضر تنسيقي — المسار الرياضي (قيد الإعداد)","sourceFile":null,"ownerKey":"masar","ownerLabel":"المسار الرياضي","digTypes":["open","horizontal","micro"],"mode":"single","logos":{"right":"amana","left":null},"header":{"kind":"logos","subtitle":"الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق"},"titlePattern":"محضر تنسيقي لأعمال {digTitle} ضمن نطاق الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق","showWorksRow":true,"showHijri":false,"clauses":[],"parties":[]},{"introSingle":{"head":"إشارةً إلى طلب إصدار رخصة الحفر رقم ({licenseNumber}) الواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض والمتضمن طلب تنفيذ أعمال {digLabel}{roadPart}{projectPart}{lengthPart} وفقاً للمخطط المرفق مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال شريطة التزام {contractor} بما يلي:"},"introMerged":{"head":"إشارةً إلى طلبات إصدار الرخص التالية:","row":"الرخصة رقم ({licenseNumber}) تنفيذ أعمال {digLabel}{roadPart}{lengthPart}.","body":"والواردة عبر منصة مركز مشاريع البنية التحتية بمنطقة الرياض وذلك لتنفيذ أعمال {worksDescription} مقاولة {contractor}،","tail":"وعليه فإنه لا مانع لدينا من تنفيذ الأعمال، شريطة التزام {contractor} بما يلي:"},"status":"غير مرفوع","version":1,"active":true,"updatedAt":"2026-10-25T00:00:00.000Z","id":"T_DIRIYAH","name":"محضر تنسيقي — الدرعية (قيد الإعداد)","sourceFile":null,"ownerKey":"diriyah","ownerLabel":"الدرعية","digTypes":["open","horizontal","micro"],"mode":"single","logos":{"right":"amana","left":null},"header":{"kind":"logos","subtitle":"الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق"},"titlePattern":"محضر تنسيقي لأعمال {digTitle} ضمن نطاق الإدارة العامة لتشغيل وصيانة المحاور والجسور والأنفاق","showWorksRow":true,"showHijri":false,"clauses":[],"parties":[]}];
  /*SEED_END*/

  /* 190mm footer fringe (assets/header-fringe-a4.png) inlined: Chromium margin boxes only paint data: URIs */
  var FRINGE_A4 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAs4AAAAjCAYAAACEqYxZAABF20lEQVR4nO29XYwlSXYe9kVk3nurbnVXT/VuN6eWu6shKZJiUSJ3d/gj+EecB4GSYMAAZc2LpNV6td23qmesB5sg/GAY3e0Hy4INw7YEGIYpCLBsE9ilbMAEBcsUzYLElbRrLEnR3iJbFKkVNVT3zA67Zqq66t7M+Dl+iIzMyIxzoqbbC9sPE8Dg9mRWRJ6IOP/nxAngw/Zh+7B92D5sH7YP24ftw/Zh+7Bd2RQ+97mXsL09z9607RpKzTCb1eMeyqBpLObzbbbPYlGDaPaBx1uvW+zuehiz9VzjPdu5wOzpEouFGj2vKgeiBt4vsz6LRQvv8281DcHcvMS1i52sz4vMtwSD9w0AQOtF9k7rSyi1gHPVB4bPGNvNK//Ws50LzNolFma8RheVw/XnhK+ZEczpJa5dez4YtL6EtVvQWo+eV5XD1tYGF8ycSjih9SWaZp7hUT9fBifOZxt8VGs0TY7nEnzee9T1hp2ThMulNSrh0Wy2wZnW2Bbg43DC+waLBYlrdK4W2Jn0KY03m21wdqZZXiCN96J0I+HY/xO64eB7UV71IrxlvWix+/8SbxHpRoChnxPDC4yxIDLPjZc7Oxc4P9/O6KY03ytpV4CvxFt42vC4fn0t8pbFglg8kui6h4/BiRdZo/juKTPfEl5K4xXx8gXkawkvz8832N2tngu+q/j5t5K3zGYbNI36lvIWDmevohsOhtKcSrT7InRTmm9J5kl0s1i0eNd7XJd4C0MbJdq9SuZx8DUzgpnz61eUyUKf0nxFXWxGmDUXCqt7fxvA74FIQRGBVPgFfhCEt6HwBKTCgoT3H4OiWwD+MaAUQJT8/hGAnobx1HS8TwP4PQDvhGdA6INXACwBnFw5HjygFAHQIPwIFH4VQED64Ts3QPheKHw1h0F9EoTrUPT14RsASG1B0acB9Y+SZ11ffAIKNwD8Xyx8hFMoemu0RlAvgeh7RjDEPqS+B4CHon+aPItw/jAU/RMA7yfzCfCBPgXQV7r5p/O9DaiPA/Qroz6lNSJ1E6DvgMLXMvigvhsAAQl8YWJzAK+C6KtQcDkM+HYAvzo80wA8APwISP0GFJ1P1mgXoO8D8JWAeyqBAd8JYA7gN7M1gvoMCP8Cir45nq9SAP1RkPpVKNqE71Ps+/1QdA7gdydrBBB+BMBvQGEMH6nrUPR9AL46UE0P3w8CeBvoaGPYpzkUvQpSX4Wi6Rq9DODbAPxjBie+HwrPAPrnGc6S+mEAvwVF703o5rsAzApr9A0oesruB9RvAnQ2Hk99H0BrAN9gxvshEH5nPF6Cl0p9JaMbYB+kvg2Kfi2nG3wvAAvgtwGlQBEnsAdSfxCK/o8cL/Hd3Sb8Vg4ffgik/hkU/f4Yx7Df4SbHq34AwLsA/cvJnBRAPwqoXwt4NKKblwB89wi+4fcPQNEORnwMAGELwKcA9ZXRN8K/vx2kPgJFv87zFjqFwpS35HSTwgBc6/kbdfySUAH4YSj1KwC1Ge0Svh0qpd0e/gNAXYzwcmg/AkroRk3mq/DViHBX0i6pGop+CMDXAJjJmt+CwidG/C3FS9BvIfLLnnZxHQoHAL6S0S6p7wBoDoVHDB5NZNRov34UhF+DwmY0HnAAUhdQ3BqpHwXo/wRwmdAf0PNmZj9IfQqKnmDKW8La/lEo/Ho/XpTZwA2Q+h6BbnJeOvz+IAjfhOpooF8/+hiUEmQ8/jAI70PhX/Dw6V8H/OWI/xb5OX4IpBjegi0ofLrbwwke4WWQehmKfo2Z7/d2OPQ7I97C0e4H4S2EV6HwzwG8O8GxbwPwMZ5u1B/q9vV3RrxAqS14+hTLC0j9ASjsAHSSr5H6DEBv5XjZ0TXUr0BldM3gRN8mtKuoW+IlCD8AhX807Gnf95Mg7EJ1ehB9AF2M1C0o+jjArtEBCGO6Gcu83+x1hgH2BQifgepwgkgBOu7vp6Dwe8CUt9AcSr0Kpb4K6mRyT4tqG0Q/2M93PN5E7ibjQf0ocPfwEFy7e/Tf487hT2TPDw//DFaH/x3bZ3X417E6+rPsu8Ojv4U7R38i/87hv4PV0X8uwPA3sFrx462OvozV6qP58zc/g9Xh3+H73DvC3Xt/LXv+uc+9jLtHv8zDfe8vYHX43/LwrX4ad48+mz2/c+dVGYbD/wh3D/8D4d0v4M6dT2XPj45u487hl/k+qx/H6t7P8u+OvozPvvkRps8fw+rw54Q+97Fa3Wf63MDq8Mu4fz/3nqxW/wZWhzwMdw9/EW+88f3Z888fHmB1+L8LMPwUVkd/hX93+LMsHgHA3aNfxtHR7ez54eFfK+D5L+HOm9+TPT86+l6sjn6J7XPn8GdwdPRvZs//0l/axZ3DL+OLr+ee3rt3/y3cPfyb7HiHR/8V7qyO2Herw/8Vq9Vn8udHP4XV0X/M9rl79L/gC4f/qjDeL+IL976Pef6f4e7hv8v3Ofp53L37r2TPj45u4+7RP2D7HB7+BFaH/4MAw1/G6uinsud37ryK1ZFAN0f3cffwgTDez+HO0b+eP1/9adw9+h+F8f4GDt/4c8I7gbesPoPV4S+wfQ4PD1necnR0GyuBdo+OPovV0U+z7+4c/nUcHv4F5jsHWB3+ogDDG1gd/pfZ8/v3Ne4e/QPcu7eXvVut/iTuHv0tdrzV0V/F6uie8O6XcI/Bozff/Ig437tH/xNLu6vVDKvDL+ONN67l7+79OFZH/7MAw9/BnTc+xYz3h8Q1+sLqJ3F47z/hxzv8WRxJvGXF85bV0V/F6t5KgO8Yq9Uns+f372usjn4Zq9UNBoafYeUuANw9/Hv4LDPe0dGnRbxc3fv3cGf1nwrj/U2s7r2e91n9aazu8bR7d/XTWB19jv/W4d/H4eEr+fOjnxRhWB39PFZv/GvZ889//pYok+8c/gRWhz8jwPCXsbr372fP7917Fauj/02A4T/E6iiXeWG8n8Nq9cey53fv/qkC3fwVrI5+Mn++2hdpY3V0D3cPc/4RYPhZrN74k9nz+/dr3D38hywefeHeD+Du0d8VxjvGF76Q0+6/fe8TWB3+Pb7PvRXuHv7X7Lu7R7+Mz3/+Vvb8ztGfwB1BL1gd/Rc4PHyDfXd49HdZ3vLZNz+ClYATd4++hNXqx7Pnf/7P73R6S+7ZfvPNj8nzPfwF/MWjT2fP33jjGu4enmhAGQAKP/ZjNQCF1WoGQEFRA62pfxffAwDUZvS38Rdq02nmw3h9P7WB9sO7V2MfeBBZdjyFprNqknG690Rr1HV8pvH66xUABWs0gABffBb7KuWgqUm+oQEobG1VUGrd/33axxOB0PDwqXYEX+yvVA5D7EOwUHo83+G7l114Ij4L/27bGhqXLHxaKxC1ybPYfw7QJeabfI1QA9Tt4XTfiSy8NtkaBe/mBt/4xrwfL/Yl8iCsASi8+moY54txLbCGVcOcRmukQp+gjCd45E0/p/hs2P+mQ+ExToRxN2irYb6xr4eBUm4EX/wm0RpagM8TD5+iDZxLYQjv33tvBo1L/PxyhmyNtAcUj0dELTCBb9jrNbwf5pjuU/Cs5Guk1AYVqck43XzRYt6tXzoeYDK87MfDBlqn44WxvK+g6AJf/GKOl+ET4z1MvxXnu1rNJjjB041Sbbf3DE6oDXSyRj3tKoImgVehAfmct9y/X4u8xXsFqIsRfHG/lHKd12dMN21bAwLtek+dZ4rhLXoNS77/e26NIl5GGDxchhOAwle+MoOii9Gc0n1SE9od+G8L6mDI6AaXI7yM891sapBaJ99Pv7VBVQ1zin0uL+cgte7CrOM1d5563hLHie8Ia9QJDBxvIZrQLhzIj9c8zo0SWhvjhIbSl91ejnkLqAEmaxT/I9p0siCuW/j348dbIGywszPQZpSHgS/7DIYA+xoLX/Xj9TJPaQCXLN2Qd6gqAcfUWL6mOEGe51VQG5AAH3ABogG+1X+T8BYl8fPLEHya4FHAhc0Ij4c+vpdfLG9xAw3E9TAG4hp57zIdZJBtXYRhwluUIijP0w1gAO+SZwO/DPxD93Pqadc7KGxYGAKvStcg9q8BXGC9zulGGQ3QeL6RdqGe9Xj5+usV7nc0Upsa6GhtuuaaLDCBL75XuIS+rjMYtKIuapfrGYCB69Z8KvM8rWFMrge9pAOev/76PIMPGPYpXaOqmgH6Er/92wM/iu/W6/AunW+qi9UMf3vvvRkUnumOMRJu3yYAhP398Euwo3fxPZEFlB39bfwdlODh7+MvYKB1ePfaax7XHnXPe6TNx/Nw2XgA4fTUAzDw3vfPDg7C71w7EOzoWd+XfP9ugJmC4uctvvQl1z+LfTRZKO1Y+EjZEXzxe1UVlZrh2fA9A/Lj8eLfQLlOwUuegaBUmFP67LXXwtydciBvu+dAYLqEd97xIHLwy3yNQqrIeF0jLEpbaOUwXaOqciAYXF76fozYt6o8QvoG4dq18OzrB8N8tRu+H2FQJgr5CHf6Pdf9lz5Dj3/VBGcBwhe/6KGohdoMezha825dvvM7w+/Dhx0csB0sYYwvfjG819pBdbgS//ZRAl/cpxQG3eHe228Pz/o1gu/Hy/AItqeNCF9cJ1IWvh6eRRjC98fj9bD4Yf36cSjOt4XRw3zTfYfzo3nG8by3cAxeui0PwOHrX8/nOyj2DJ9QDujw79H+mG4iLk/phuB7fjSdryfb4/3BQUK72oIEXhX4WL6HJycEkGV5C+Zu9J10v8J8c7pxzoOU7fEq/V6ka3aNyI9wLH6vId/Nd6CJSHMEnr998pNhn5om5x8BhjHt9vyXHDTGeBm/qch2jpUxTnjvAbIjmZD28T5dA4/IW0AW6/UwTs8n1IDLcd3675HrcSLlLUQeoIB7Dx5ghNNK2Z4XRBjjvFUib+L6BPoPc3JueJbisuv4+bBGA28xVRxjeL6zE9bi4mLgVdcS3qIZ/hZxzM8H/pXKDUzo89GjZL6el1/AWH6ldKMKMj7yqgE+9HBEunnwgLD/L4f9UBPa6GkAOa8KMARDdH+fkcnadzyO0RnIQVXDuzhmXfsez6e8RanozGLgU2PeMqIbzdMNkQW0GeFdpI24Dv2+Xxv2cIqX/brCQHXzTfHy6dOwfteu5bwqyK/xfB88GL6l9fDuoRr6RH45XXPS+R728JDFrM1pl+B7PIpzGfjbwH/jGqT4nMIXx22arh9ynAh7lK9RyPW2uHVrTJs9TDTejxSGVO4O++VByurOkuCa6Rj0uBFFpYvvQ9qzb4iCAJ42rS20ksfTzHhhIlG45fAFLzoDg4uLPm7OyX1QRcU0bwq2Y+w5DEFJAk5O1PRrHTJxzXSCYNxms0A8gflOYXDQDOxvvklQysAya2RtFNh5U97Bu3y8y0uCwvh52Ad0SpWw5mpYo0C4cU6+I4KhHR/HPvkaBQIBlIpK5vD98DwomWGtJnOCy/B8SPni19xWQckEgPv3wx6+1n+rBep83xcLglYG16+nTC9+LyqSXItMLm9EPI4NxgXTVIskoXLSTMeU8u/08B1PhtOmM1bGbdYSCC2Ll0C+vykMHOxWk0yHNOz7tAVcycerCjCo3ugdty99iQDVomHwKERWWh4+HYz5aatrCgadysdzV/ACbk4zyr8TaaOqDDteEFYmKKiTppQDvISXPAzxndEcXYdvnZwMzyJ8gIEKoZoR7QKAgoG1OY5V5Pv8zQx2tDAJbUQ4ovI+asddnyIdGlAl001dczjB4WXntVUtFiO6Cf3DPBvYG8O717pfDQMq4Llm9lBbmf9Cybxe4n2AL+IE3wcAtT1vUWrg50o5ka49DDhe1TQk0sagmOYtpevj0XN5jZRynXHBfEu1LE4QyWs0KNuT59dcF0nNaUML/Ch0nPK30OfJEwLQ4vIyx0utqZMDQ3vwoNNFvIGf+e7Z0LeqAu1yzRvXGRfj9uABwcN0RvkEBj/MaeABcQaD3jd9p9Cw8DnnM5x4552Yd94CzD5tbRE0DJ4+zWVy0B+HCPYIPmpRuXxOiwVBUauLRMoJS60tXIEQlYSAvTUfWlwsh2gt501CpocPA1JwSpLVw+ZzSiuHGJHZc80bBy0Q6eBlmj73neWWN9VbWlwzrJLZNLJCMXiZxu3114MxMJ/na1TD90rhtDlRUQOgDA4OBCZSEEauGmCI8yr3yRltJJDwXBJuliXgogKgTMcwuv/tfmkj7yHBAgxtLBYEopZdI61zok/hcxO6ibirpgR8PMAtGitwGbNXcWLKQbVu/KyDAYLRKwnLwHgKxoA0X5XwguMEbgYnjvt3BcFCBmrOGcROFLAprY2GokBrnMFZwlnJwCmtUVGYT4zySDdKOWhpzQX4Tk5I5AWGPCsQw7cKaw6DyjLGAOOESGmXw6Pd3WCAbW0xRm9B8SPlOq/35PncA5WgbPdRPa7xOAEA0A3rqFHKikavIova5PCdnSlAOdRLBl/66NhopB6+quWVJBKMKQjOIqCjKYaXOudAwjpciRMJL00NJtkAsyxOzGYhEscZ5YQYUeBhAKODOEd9n6leIMlxIOxhNPZG4ylZL1DkBhiOh+clPQMFXgDBQbe3F+h6d3dYv8gnjIlRvbyRsObep0bqeI2CcZjDpxRBqxYbRhfznvo16nlA38+y+wQgpBcxvGU+j/KVkfHkWFwGghL89i6jB9U53cSmFc8LAn9rdZGJUJV79koeZyILMBYxABAa1mMUwkKCF8fzjDZEnc2IkUWEqb0ViYq0LNwkrwaRFxlFyHHmPR4kjAdtO2Y2WORDM6wgWC4jfAzTrOT1IxjMN5wiWfA4K9srPCl4u7thTjnMURhJhkLbpULEvw2/1hJIgFsp2QMLmKAQsd9qWGMKysFO9rC3vhM8ShXJqqIic44e7JQ2trYoW9f43vuyx6MSiF4pPrIC8gXG02bMPnrYKfEKpS2FL/cO8F7q2SwadMPfx/kq5WQamHjpUmMq0uFUuKVe5eNsQAPTPqfnjCzA4JFSwUO8y3SZzeRIEsHDM9+azUhU3ktRCKV4XmUrmW6IbLePXDNdKsS4VUUDlvecAQA0z5vXcwKo7VJTxk2aEwCALOtxJsoNzmHtN523deI5s5Tx7N5RUxmRn5OgoAQ4+GgWUHCEqBYXC9kY3TnLvWAqUWpyBaEZrfmIboQ9dIKzKMLAyeSSQUdkoZl9AgBow/Mq5WQZCoO65pR3D1ADibeI8kY5eJUrrd7neNR7xBM6PMakCcYeVYnD6rXJSz1EDVJe2rQyLwB5MaJG/VmDcYuRJK7NZl7+luKN3hBRkfGI5y0hX3m5w9G7gxdkqCo56PSA56lMvrwM8jWl9WHABpbh59vboc/1J3mfRuty9sQsn9P2NgEwGpXovRhbJSnSSourtenyJJl38HCM8B1y2BgQBEamVAijcx6UEKKQiep5Pc5alyxsxyJ0VeVhpuOkjxcEAam2D3+mreS14gQLENYIxK+R95Qp2yMmwljLW1shL2+qVIVvyQRCysJWeZ/5PDdIUg8Fp4TEd44JewMBX9ascCt4qaeMMUazvOyVV8qy4buLCwKoGYWpe9gKBpj3LWTvcdsT8IMH1K+Rv0Lp4oRRaLxw05r3PsXxLGPQXWVweoExej94ZFJ8mhETPTmO49nBM3o8Bd6gRs6rSgai7F0MgoAzyqmRDWJJmAcFQF4jSQHwfpwqFwXIvIBH5Dx0lePEwUHAy1OuTyXjEWAyXjV0bLt827Fwm12S7OkiPuz95AlBqQY7O7ki6RIDbOq1Ao09ziqlXWHNq8Kaa0FJAoIDwLGyTY6yAgYN43He3SWQ37CGAmBQCQqUlC6ilOuNqalBp7UtRhTAyPiQOiYYvYVUElALI6SzyPKrDd5R7p0UaSAvO9sSY+D2bRpod5aG5cetaNCBj2bNXOIYOB6/Cwf9mD4NibwgyCGBF5ADJ7+OjwFQw+JlyPOXUpyafr4p7b5n8vSOvo9ywpoH3Ul00Alzclek3lWMzrBYUGdM8X3qEW8J/c/Pg5d6b48Zz3tQLKHXvY7048n0Dr8+N7wbD2i0yCik8GzZGnV9HvPUWiayAEMgZO0VShKfEwcYvPceB4OHEggEgtW02cgIMxx4ZN54A7L5uw159PU+YzvuftXgrcw8e2RZS/D99yHDZyRhHk7Fc16mkPQupKYoF7ziA1QAOqVQNWyYpOiVpxZzznr0HlrYJ+oT/bkmh1O13uAa5/GAQcUoFACg0D53rrxSLYzhrdGiJ0TMieMNsAj7TEiZktZBqRZ28q5fe/LYMFGhUioEoek9e2mbz3MPezreVHk5jrDDsEr1hsqKqeRNVcTv4VWpEPyaB0HACaM0DSwbz/PrN5/LimTJKCeyqJjUGV+gG1SG/daDB2Gf5guedoveRVGJs6gYpXCxCEowl9MdqhcI4VQBj5zOvcd9Uw073nxemJOTvYueDBuWB8JacE4IwImKJFHLKroxVeMJ4wUjsmL0CaplU9FsJa+R1rZoyFgm57yYHtMfxOVe8qkpCnJ6TPDkc+dwPEIVIq6PlyMr3rGGTOXkKAS0HSJTx9OeBp6Neucyb+hq2EjXbFYyKuU5aTSwjDy8fTvQdfCCjluImBZol1FM63roQ5PXqj+AysDu+TQwr3MHXWwatqsaxA3YsviyWAT+y/IWMtDMWbTTUxLleFURdIdjfQQ6gkC8w29nhwCyGmYScj6OHUsH3wrW3mwmu9+5cC8KRKWFcCDQKQe9xT5OJSkJIw72+Tw/+DbAIKdCaG278krjNpvxeccAoLyTLS0aQjKpknnrlgwfVdJ8A8Jwa7QwuULRH1JIvAOpYr+9LSOgcpI1CkgeTs4r3zc35O9GT3iERT4shwJTKuf5ifCBV/xyGBLrFkIOFoZ9P87eyV4crYZDWClOENm+D5vyMznY0KdqoMF2Mt/YVQthWyBEITzjwQ5GGS/cqorx7MWPVYb3yMzyPuM8SSGVhCwbVit6dIVUNCDwlkWiZMZl39JOTJPwiZJ+nDy/nFN2oHAcvSuEChl8riqSz08ox4YeA940uOFyXsClahz3/awYQZRSfi4WOZ8YDva27AHxcCagSQ7wDK1KeHZ+iMiy/PKq8xNcfn0Yjz/EGWHno3eF/F1t2MN88d077+R0qFQrpqJNeWmcM20KkR87yIcpn5DyvYl8n5s66dJFNPg0MC945T0NimkOQ4uG8oNgiwX1aVHTluJEHK4ftzJwyd73RzuUTLuur0LENdmBWBXy6LnxvC8cLoYRZagUQTw4CN7U4AUFABpwggZvap7Tzad+bCce2OnpME+WLRoQ4OMdF7qyPR5lkWote9gBAzsyOLs0K1fWPUPFnnFbLoMcD9VN8uaJ3/e6agaHX/L86VMCoWFynI8HQLjDgc4NjOd40iUoIcJieAfXCaqUQChJOo/In45XieELg5s3h//vc2crEr1WVeI9Pk6eX16mfcJAacWIuEaxz9B3EOYHBwPSapMrkhFxLNmu3irXpkpmF5Yv5EyHki9SKFh4Pit4ZDSfsxdDHuxhjYKg8tSy1q1u5RxYjqHHMC1ROwrLj+EYM+7j/rnsJdGqYb1C3vs8/eR4GI8TOKc7gUgfPuS+xCgoyXhSdRuiltVNlR/oME+fGZj9NB9M62bstUpgkI2LdjJeF4VYkHhQLfABQVh6B59EalK60VrwpirZ4CRqe6/8iLeQzFu0wN/ieE+f9v/Xc87S+Q5P05B4gGOxlr3UBA/nBQVFSJ1J88DzlvDm0YClVLRyPmspjWPy1wAQlHMhnAoY1IyBAwBQBq+8kr+rC46Q6WG0vk8tRxClcy5AcBbl6YRDTfIhekcj42J6sLf31gkRpt1dgvKbMd3GARlFrVdMhfFK1RCISdXoP6V4z55jDu/2fch25VZ5g5OtalRKxyQ7iah1dFMIy3PypjfOvEPFHdife/lQLfic5PiOO7CvNcN/j/Px0hYcdPzhu6F0W96IWoCJ+AVADE53ePlVohvDRAbiuwDPuFVJDvbxtItAa7PkjEmU3wNfKlVnsayXP4UvtrTaFofLu7sEpdssDR2IfILHMeeTiGSyVbu7BMBo1r0dAGnZhacqER7HGP2GPoKHGK7PGUlRJuTHSsq2XB5IgbdulZZPu3pvJ7CHRQ+nUqWQrgP8JJcp/gqbX2JkSllxvkrxSmb8VoRo3Ek+1AUYtMmhqf7EbTFPnReWIf/w+asDaBhcPuca+WSN4px6j7g2TE7ccOo89RTGfdK6oJjCsnhU17nHeZgTHyKOMORsB/DaDgzmePq2EMoUDyw5sYwjMaGuNFWDLUdXzOU3bGmeAJ+gxDHpQKn3mFOCiwpAIZVEaz59p6oYg/O4G0/Zomdv8bF8vsbIoceq8l2kBKP9DZ4z4aS6t6j0uM/QdfDKpwqKKSmFZEVvNMCXe6MkPYZXAGT+yx4E6/pJzxWjAJycyOtainAStWies5IJF1EbecQLdM3xFsCAq7ATWoMls0ZnZyGPnk97y9NjIu2Oo6zp+yv4uZvIhwi74ACoatlRE85jfFDHTw5fFjUQdIaLi7K8kaIGw90K8Y87uAvOndF4kyaVJeMM2PT8Cbeu67VMuzrRTbgIIuf4efiQ5Fz+SqYpBV7PGJdnG7cR/2Xgc0w0y1rXlRtkdJOSIwQNWz3m7EzGCaBho6IRPuncUbhMKm9KtV0Ndu5lo/sc4rwjn4ZQkZUXo5B/CrUZBPZIcx4WcErYpAoebEmAGXlxg/dYhp3vJIdTtaA4l6w9Xcwb5MfrSqB0/zcNU5eqfjTAt+XPK1cQVFb2zgYFQPIo8OvqhQMtpnQQoVCBIqQDyQQSGC4mcBbwkho2b/DZM1nxGy5hGbfl03jLJBdy9pny3hsDVdMrcbkXp+kPYY0HNHLqjJCfBQSmlKbvjGrsSlU6knSWlHRvOA+vBA/KVeFyhgaupJvSCWiObgqn7znjom+qxR6jAIST+XzaRagtm3/r4iLiBANDxeDYybAf3HxLSmGFIS8/V1B4GJoC/9CQ19wrKX+3QNeqBTHC7fXXgzf18eNhvLT8XsmYEnmLeBBMztUs8QmlNglvSdZXGWjBAwvwuZ/xHVuXn1Eko8dZSheprqi0Iudg83yMvM3p5jj8aJQMTjnSIJe9HQywNN1ma6tkIA5Ka4bnumXPT1RGjkTrQrRN4i0N+UItaTep2DN40acwjKoQ6fGcUmeRiJdosWRSnC4vC2kNBQdndDpOc36Dc2c63hAF/uY387GsztMxR86TkkecoevlUual0vmJJ08I5PmzWdYqMYKoVAt/mY938yZBcakag3LA51qVwiQl9/u0/EicSEUWyvOWm9ItZuKhAt76Dsr5eHH7b2nblecZt6CY8pYHMBDIFKG9wGjDGsgHeJ439BjGHCsovWAxrlDZoMXyfBgvPXXunCQQeY/z06cFBaCWw0xKtfAX+T5tbZUPgonGhTf9pQdZWRq1GdWCHVfpEISbMlguGY/zDYKX1lW1qOtSPnXenHa9kpkZFz6vuzy8NKiZA6NwXhRgWjfQMboz4X8V8af5lXfBK86Nh4Y3egEx/EmQhZvENEt0E/BB5gVsHniSxpR5F9nxBkHAtVK5pnCoLFdaAz5enQqRKwD84cUt5gDlUPKwnFqxw4R0F0yuZuqBlRwrWigVulzKCgq5IQSb0u7Xv04AtV15rUmfmRxi19WGFW6lfbKVgRNyNUspTsVzMxM6jEqHUm04eD5pu7vUyZucVymygOAYIGq7W+Iw6kvkoaUD9i6//Gn4VsPyEOcoo93hIF2hQhH4Q7Ul76Ik84J3kb+cIuQrS+djeMOIqJCqURm5upjgRZ/RkIYwbUq1rKFwlRf9g0QQx3gpj7dYlBwXFg2jmDrnQcTrTi4xOAdeNfCJNBozNnoLHmzmIjMAgG7gGN5Sinpr3UyqYIS2txcOhXIl7Opa5lUhwiTKZI1azE3lD02FpHi5jxhyVo4NEUuVLkIzMNkCDmF5tkeBacLxBwS62nxsFy+kLgDyfMupGvmp3wFx+AOU1srW42wmX9QhCUut5VzSUr7tdE593epGVngUtdjaYiz20j7BDGHvadN8lYnYjzth7LUVFQCihi1htyyEiCWl5pVXPJRggHnyKN+k93wHL0p9QgUAfo08HG7c4D3YpZJMnHALeMnPd14If3pBkJboJngD5XQgrhpNuIpYXtd8voMgOD/PxwvVBgoVe5j5nm2TTGtGvnyEPJ8qF6IjBeErKijjw3epcJNyZ32SQsQJNw4viyldFX+g8OREQamWD6c2XvSmhnxbRukqnAmprFwvFzBYiDTQjNLe+vEq+VDt2OM8wBlTNbhGuoWR8llh2EtivPdAh2Oc11vy9nrl+LKVhbx3Ls0qNRTWzHzJWJGfK2rRtnKki2tVZUGVkJsKw+o03nuQQIej2s/Td0lRA6UmdCPpBb5U8ICHofVW5FUhTUI6G7Dp8m6nfQYayHFig13p0Kp0IJO9L2LY9+VSgqEg86Q1FyJJb70lr58SqrME+DaZAwmIt1Py8ovA87fHjwnQV5Sj45jcVVe0igvlNywgRqh0AQBwBpXg2dNoeA+KT9Maxk06df7220AxtFdgIi2TStJol1lufXOywgMYGLYOMUSvstGcMA9YotHgLaZPSUHRmg/FhYM7/JxmhcOGSiih1DyVw6mh1jVPVF44ERxeNqzCUzm5zJTSFs7nXpxAVFIqSYum4T1TxTxwgW60oIgDwbvNRyFKh+V4oo/jnXHGhbeiV55Ui6Z5PuFmrUvSOKag8xUtLnzu8RjG82y0KMLH1l0mD8uUi4xwSwfBlGpDGaNJS8s1TVsl1ENeXivTmqRQeOJT5ZqGeiVp2ojk8aYw9Cnv5CHdngXPl3iK43HXkj99KhsKUAaaM3AAcU5c+s6AMxuWbri6/KOUmgL/bQrykGulKj9EDVsO9KrxZkKuptINTk/z55yHfVgjD29kY4pLhVTKjSpTpM2T7IQADGZMKkk5h5g38m/d8lAkKDWzPO1tBPtzOrNMQbEHWTbXtUg3ieNnekGWuO+QI4iqJPNgcPOmwKtKODai3fBva2X+C1vOA+d0sVnhIDORBaSLdNDAnz9nNEvx9cBLl8RgR5ZfEJT3/X0CUavlcK/iwwPhYoNCSZAJ0feIUxlUjJVT9JJUXA3FIZWEK19kDIlEEA5e5LAHa6kQgpU8Xdp21vm41YbE3BmXnDCeKijet+F2oUnb2SERoStLzPoNa8TlPzWNE9MQtCBYPvaxvIJC7/s3rq8OMG1TpSa25TIPnaXCrRQ640pQBeBL3kqBKfkNy+xnswKRkoVa5OM9fkxQEwVgFLaS4HMmqx7T44Ya002/RpV8WE4pAysoKEqtR+k7wwvTn5bPXglMZGeH4Lys8EjCTWsLYupgb20Xwqm1nNMNGDYPvBQdgzPg6soDHd2I9cp5z55TjsXZnTOCdXKN+JISx+3vbEZiWN5rOZ8VvmGrVlgbrsxlW2UKkZqWPfgGyNUfvB+EW0q7Bwf5Iae+0oqWeRUUnxqwZHLRhyYfRndeVuy9571q3ueOhkFe8gcyh1QNID8b0MB1yuzUKPeOH29Tue7QHtcc9Ezg9Yo32EvnE7TObyUdDNUGuwlO9ClEhajt9DbE8cf4CCc1vjBfA9hcaa0qB/KCB7aggyhqsZ3QQNwt771IN1JambUezgnOJxho8bZhAy+e62lGZwP6p42sMwD8uZ7Q5PNhonHhx7pYpF2jZZmnyYqpgeEck5DiVNh3Kc11KpPTJqWmEMl4SdRoiEnxk1uUItK6Sg7la7LhymtuODh2s7S3fS3pHEDLXLzQ3ewinOYPKQBS2IpnmkXFtLJQwpy8F8r5uME7y4bOJAVFt4n3c2hPn+aHP1LBkpftiTcRNmwYh8t/SpVWLjz7ta/lSBYbzT1q8drv6TXYHR45OQSrCwqALljfRE3vCU6bUwalwx+7ozXvmH1R+BooxmDa36eeOeew+aLiJyqtvmXz0byXq7NIeXmhn2PXiLyVSx4lN02l7enTvPJI5BN1XYgkCUqh83J4UUG+hp3QsHng2rrs/EQKg2aMH6DD82/kz72X99ALVT+4NYotPRDEwcfhuV0W0qJKwm0KQ8o/JCWJbLHqEndQbXe3JLCNmEIEz9c/94XLTCQBO5+TfLlSZcWb+WrVjsLyaROjEMrAiwantLcQ+YTOyrMl76SIXxtKbrHfKaXe+XGptZ52C7ny3hcuXpLOrLiCYqpaeCaX9OlTGY/K5U8L8E3WKOJbnfAjVl6n+/EB6MaTlWV8waArKe/SmRUo/mxAiVcp1WLD0q5HJaXelcpWCnOaFzzOSsnn18a58hM4+xSd6UIYlnZPTmSZ7AtVNaAMq692FYC0eMhJJUrh6ErVQu6n1yWlZo0bjMfZFTZE+Zb17AGhEgGnFLqCwqO1YwXB06clxuM7xYsDkPdkzmZ5mL8/PesK8xXqYAI50cfmvWfeDd5K7nYq72VFVypHt79PuZD/AKV+JCKYz+VSOlQVlMLKsCWoAHmNtC9UZ0HD5g2W4POKvw2xBEPtbdErJNGNA39zFVfrOrWWJcVZ6Zalm6rODbrhxHehzGSBbuTwsWG9DbNWphtPA05wwo2jQ++9GHJGNZRGm3r2pDVqGLoeOhXoWlgjY/KDW0Mnfk7zOYkRv6pQsYd0y3qm/FwWblZI1wOCMB8Ovo3H1YJw05p3NDx8SEDVsFUm5iUDNsPz0H+zIXHfdaIUcnWI2Qo2CHvIeZxLuZpAg729fLyzM1W8Cr5XACZvvGrZPOti+b2Ct5fP8w+pd1xkNoxX4AVKKBGrXIH/8kZ+rL87GicZT4pIVpr3ZHrvi5FoyfvpVcvWPOboJuVvXGrg6Y6sZ2h9xRoJeClFRTkdJDZFbXJF9nhuVuBHxrgQ9WOal/hlIeVHSgkNA26SXPmhBV0mjjeJxgi3xwLoDAherxKNFS/rYkCjxQoFpC0o2ayItFrLi5EKsLzigcH7O/yJW8kDQNqyJyWBQKRcbs+ywES8H1I1OKaZtlHNY8uPV4M/hV1iZL5QgN/7Fva9XMkMBfM/uIKS5mqycNcEU/DESUxEvtlIzmeVPFOX80JNXCrvk3TaVSmegFHn3sV+vyozKjMVm/dySlLxsIbgJZnP89SFIY2JzzUEgAoNZlxYTRloIfSoNZ9aAQCa1iNjahRpkHLshNJjr7yS58SlN1dJh/mU4g3YpiFRYIM59DNS7LcTXpV6haQ0q0I5Ou9bPBF5i1D1wzrWy7S7S1AYezUi7i0W5fMTY97c5SF6LyoNTSGNTvLe6bbMz42wRpYaXF7ywk10rPhWTCGSYLi8lKN3YsoFUx0gtoAT/JwcDLRwUA1u7KiJsFgY9jr6OB7XdncJmtb8d6okRDytYJOta4BhvS55Z+WzC6HCU043xpQiF4a9yCw0OdIwNVZSI5+roBDgkaMkUydOmtqmmFJwpRrFgOtLCk7H854/0FqiGylVY/mURPmglIMXZB4qOYKY73voW1XyOSuihjVw0kj5dG+Dg1UwVqgBfit/HqKAQupHgkd543Pl//gfl9fPF2TylP/GNpuR6MzyqmVTi8OAG52FnHth5FuolIl0SNvqPN0htbQ2Uv4pHCxzCKv2Q2J+piQJSAsES2vsQRlSAFwhlMkpB7u7JOYeEfnM0uqJSrWT1JSBkYnVBnQr3oYIx9f9DAYCD99GDfltuZK5wd5ePl6qbOd51jZjIgN8PAwLpkbx0HgBu1gTvFh8PBduKSPjSlABgHMNrxQai2rDM3uyTVf6aNy2tnJjpQ/tqY3o9Z4qapEO1muPqpIVgFLxds7yrcnDFlIrLkW6sSxOeG/FdBGgwZlkzYvXsA6Mm/MQ+zqnG2s9bEGwiIoutXDMYZJQ4klS4mRGq6nFAfsGxfkqJwg+MefX9oouZ/xw6UCXBbqpKtkrLxkk4RpgXqmpC2cDgMmFIF3b26OMT/R0WEghqiTespCrYFRoEuFGSR8S8/9bmExY9mvlDJs2ENrzn5+oqg17WBmAWOHBkxVvdSM0uHUrh28+JzE/1lU5XQ9RnBYtE9723oc68QJ8HF4CQR5yvFTNnchbSFvUjGPgyZMcj1L4JKNJ4mNu54rzBKLjgr+HoKpIPhxop/wttJCjW3Am6ILyLhl0AgxBj5Aqt1iWdre3B5k3reOcHvDM9Axq8eQ6s+/K9dGnKW/xhbReVE134+q4fe1rhXSbeiPzqsx50umK73vRgNXEp7MAgPetxqwDfqroSl413TrMBcuohkE9k/KV15NcUnTfzUMUqSLOEXYYT/Ls5Qjd52fXFo4RpDdv5l6S+Lm64KX2NPbKj2CQ8sCdHJKpa77G7uPHcnh2a1tmIpKX+uxsUOKmrZQ7K3mSmsZBzYIwz5QGxwvYxYLE72y8hTVyeoxYX7HkOduSFUkuBHtxQb0HIOujLRYMbZycEJwTytHNvRyKswZeUOxt1eCUMThbmKJ3Nq9NPXhnuZy4EDKVhRFX6/rxY4KqhZPvC7kUkXOO9dLN5zJOaN/CSDjBzrczEB2vFHrdws0E3qenB27Cv5/VLlN40sgUN98nTwio+DXSRSdEg5bJa5wzdBNhCGsqhaMbPGL2PZSmlPEo1see4mVVNSyviv24VlV8uU0idPyNU1BKJQB5R8PFBaEW8LJkgKlZCy1Uj/F6zaa9aW/luvKOLwcK5Kf5h3sNGrESjMR/12uSS60ZWd54bzFnZLLWTqQbrZN820m/Cg3LS91G9lbSyPiZNiGyol3wcoKRN5bPOV9v5DWy2sFIaQMVn/bWNDIM/NmszgFW8dGnzcb2EcRp82QLUdYNW8ZxvSZUogNxw3qc334bvV4Q4epLznorRt5JN1c66PJWyE4QjPJQ0aJ0s2E+p4MDAgSZHGCXDLoG9mkudw8OCLXaaNED4IT8J+89rLCAFkb0Bio/zn8abYiwuLYQOpOUQuc8ZlJtvo1nw6knJ8iZc3/NaSH3yBo0Z7lwqyoHJ8BgYMTLR5TiEQaASATuXA5Les8rSculnO9V17wleHJC4py2tmSlULom1jkPJSC0Mo6tVgIAyrXYbKRwKu9hn88HZp91URucMsLt7Iz6WqFZmpBvxT2UwugzJ+c460L6jvItZozHvq5lD3HrW7j3hdCeXrOMtqKCAoAmGS9ncizcjWONVAAgGkK3IxgK4UUl1oEPyoZUc1487+CtyKukGrGLLRJTP4LDIH+3t5f3ibyiUYMTYtokpeZGgW5aIQUGKPNLObWi4BVyfE3hR/synyDir7dXCt0hnbzYaqlutRHKvW1tEazjnSe1lxUUa4ULPADxvgMwzqJBFjRs5acnN0k8lERVriT14zl+vGvX8oNg40O6Ur43z8dKdDM6HDjZLq/4smRay6XMpIja3p7shFgUbhitKttXJUnbbC7TLlqeH0X4ON4S8EQyUofxOGOKa0o5uRyd2sgyT4ChdNmK9Hy5lB10RHLkR6p641yh+okdjPLsW5ZPJRl/K69GI8kHKaVmPpdzzlHQxbxqtVifVTrV7ReFw3dMakVajosL42jtMJsJhF0VEr7R4NEj3ttgwQuqkFuZw763RyIzDQcKhcWd8WG6sOCS18X2BzKnRGVI9uJICBg8bXwoAmgmSlLn1ahkpSat55u2YFVLIWcPWFl55wQsd+lMvx4L2ZvqtYwTUp+mGZj9gAvhd6b4kn0AoFvZE8dVujg4kFN0qko+XKGU6XFi6v3UepxrlSoAsgHG55UDgDeWrV4AmP48AfdOGk8KdVWVk5WNOe9tKNFNej5h2iwMe1CNyGe8oB9PuIwDCHyMMzgvLvP97fGpdSCBj4m0QR5tK3vYLRO94+gmwlA7WUkCmuQ676HNZgQv4LlSpk/Xi98Y9mvD8nOAy8UNraKCd9HyB3iqavDsZd/RvFF+dkZ9nymP1dqJuZW6cCCIiPeqcWsUm5POXAAin3CuxUZYIwvDjleqv2u0Q1s4b8PxUiIvRts4Gd+fa8BYfqWRXgkGpdL7HaZ7JeBR5eQLUJxly/lZL1/WVHJCOM8feNzddeIa1bVliy48fizzj7qW+ZtkXACB/3L8fLEgGOKjY3A87Z6eDrcDDwcxw2+jHJxQVrOiRq7sUdKD3FjmDbpiy15kdnJCCS/IHThcXfkHD2TPe8l5R9SwivODBwTlCx5n6ZYntXEic64qi/l8Yn1HQKr1qAxWXKwg/IXxfD5ebFQ1eO21/PliISvBM8ErFMfjmnNWZLQEw8LnnM9gSD3sU8W0D7XqFueMkrm/TyJ83nvoajrfrhyd0Gc+p0wYjdJZBMVeEmAcgfQ1Nys+h9h7n4WFeuhb2cuvq5YNy8dvcQRcFZQkJdy81NwaDMS8NJWBFoSbxEy996BCOTon4LlyY8MjwhJu2+K9GlqnzD5/x10/CiTK++QNVbwH4NGj3EiNrapkPuG97dMk0nZxQagh4KWzfQ1gDi+Hq4iHprXDTLqNq1Axwnn+Frs28TJNYXCONzj390k0Uq9Kk+DgOz+XIyGlElkSDFXlAEHhd5UFtuWT9FxY/vZJejZgknakDHa4A+JAn+qVweDyQ6Y9vxSM8uVSTrNqWyd60adGatqk6B3mMu1qzx9gPwBE/kbKYFvKAxf479ZWLvNSY0osEev4qLLWDk7yEM+M6GxTToZhXvB+crzlKpkn8VJfWzZddHFBGXypzFsomZcOxsDw7vJSPnjsE6dGVhlFcu5cYdA9bzpL2w6VUXqFNIGBo93lMlmjCeCzuaw7SXNaLjndJDStC44LwTn2zoFKvjUVyiY5Q5c8VoUIIuOoSXkLGx0DQFWjO2Uy71g5frNu3JCZveM8xN38rFBAfjazaAWktewCdkjgBOHGIExsjXa9Upi2R49yoopNX8+FUbpG3OafnRHqmhduztk+hy07QGkNFoIXJ4cvKuLcfIc14qzRd72HmgshZzdYgtMmeTW4sFVfhcW37IGWt94C4oHHzAs8G5g9l//0rM4PBAFAnXnYu+e17J21Qsm+AAivxBE14uUPUuinqhwqx+MlFnk4cMidNYVIDU+7HoX809nlCO/SkG6/RhMPgPa8Zy++45r3HnaCl301CWUwczkNtK2H7+jmYVZFx4mlMyshMlVVrodh2uYFxbmiBu+8k6cNLM6uiEwJQkJSeNTGAQIdusqy1QZOdwbjYso/7MwCC8GQqRu+TrL30JInqW5xreK9i7ri6xoDhQoeI35+VcpPeH/tms+8lcMlFDyen54O+zTlLdgerm7nlCTRkSSWIZSN6LnasCUAT06AuRYOj4O/KAwA6pqvU2+tLPPmicIzpUOJbrz30FaYrzG4dk06DNnyeeBJqbUpDKT4S11OTnIjevhObvykvEUzEYC9PY+qmiiSUTdxiaI7oakavOdxPs8rAKUX3/TGVDLe/j6JecJcObp0PIluZKWVWb/ejWzY9MTdXcJsJtBu47AQeEuui4V/P6sdIJxLWc+sGLnQesOmJN0+SfW0MR55anBNWCNJJl9cEIyUelc37A27AFBRU8hxdnwYZ712maLbb3ArE71Sjq8fW7nMQkzH296eCsu4+/wGL5dySau5s6g6hjAVzE4Qev7ciwpPXfNrxN1EGJFie9tgdoPPiVNqwzLGgJR8iMK5PL8tthkanJzkCsAN50HtWLFPIwASE6myNQp9l0sLaydrFL0Nnr/2u3Rbo3O2/9Y0jNOo6YUlQ5sK2GFuspLkhRDsy9aLN75JtPHgAUFLhwO9z5Savm5tYzAvGCti/dhuvhmz95b1xIVu/JpvCookwOez3r5NcFVM1ZgwdO97L860zRimCQScmHqm4twCPoznG/e3FbxW3vsufzHnVS3Lq7o5zBrcvp3P99atISSeheWdx+wyN/ZOTghaUJKqyonwzdFgwRwSC2lFggDbOKARcisNX7aqrp1o4KAxYm6lbxq8/DJ/GGfKS+N41rV4l6VdQiWk/LybXMM+5dlz8IfvXn7Zwws3WuoqPxzYw1dxkZrunR4fwuq9lZcWWlgjJ8ihvT2C9+P5pkZ5XT/feKenVMBLKx42xMJ0F+qMW6ALQcYXzug0hXSWKe32SpKVK49IxlRdD2chpvILMMAypw/vfZ9qMF2j2TyPbA+RrnayH/H5IB84vYAzpk5OCFXF4/nc2d5YyeqZz+Xce4lumsb3Mjlz0JkNXhYcIWtB5i0WFo1gcEq62K73aAQ8WjQyHm02/PODA5mXOm9FupFkctt6zHEJYFjzQQ9qcYvjVQqweqNFrX8+b3B2lnv2nMvvaE+R9tkzwVr2a/5WN2eBDU9UVdXi6dNpnwDLbMZ7UBYLh0bwyFSVG8JMybvbtwnKxMXNFdNeicMYPhJy9gLSblgYzpyFFRAmVAdgQnsHBN9bguMBT08dvDDfxvNrdJbkSU77GIaJxDZl9rGFuqnCCeh5g4NdpqzWpReJQGuXhQN7b/SGSxvoGKof53vFPhtlYIyw5q1hQ7BPnhBmQo3iqmpZ2ghNKH3jPIzAyDhFfOTZY5QD5zyagsX+u8WKB/kazZzFYsEbdFrz1V6G8dIWxj47c5kwj7/Pnllo5irWlG6mkbiqchmt9bwq87APMMznPG0QGZHRevB0s7tLvSCYtq0tC1Px+yvld4Y58X2aJp8vUKabrS3Z6BWjhM5D13yIXToYFd9xaQgAEl7a/X/3S8pgwdRMj+Nx7YbzeapB9BRu83gZ4BJSAy5NplD0820MnnxAPE/X6OJCqtjDp44BEJUGySgHgrHCH/aW8XJdDZGp6XwJDbZ7vkiIdPNuKvNin35EGSckL3XFGCtD4w9hHRykxkVulJecLpzS+rRgcJIyuBQO8AKGjZjeuJF75XsP9ryFEfZXzDf3PjvTEMfzaHAq8CppTru7xDi6hj4c7XIyL7a6dr3eMqxN5+0VdDHnPGaelwHOWZFu1Namq9+et+mcevnlGzwRjAv5kGQ06vLWgI+EAEDlWo3lMiWc8YA3buTCqK4dthWvdGH0sfF4EhMJVTpkRVIaz1o+V/PmTeq9ytloxorIJHlTN5vkwA2j8PAHB2QiXViLLYGotC4gTD+n8Zz39mSPszTX5ne9+M4rU9wPrlnrsVzyhgLB4OREGE46LW8s6lom+uctg2WcFSMhW1t8OZ+9PQIt5DJYY9oITSmgbXmlxlp5n+q6RdMIaQi2xflvcPM1qI28Rh9hjNQAB2/8qMK+O2exv897F6/N+fFu3PCicjCf25AjOGklujk/Nzg/l/MkOfhu3MjzY4fDOC3Oz3njZy4IjxN4bAtK67NnjjUeDw4IW3pqlA+K/XSNBsHCOy6CR49fh2e1E+mGqGH5pbUeleGVd2utiJd6uQHwwYRb5JtLvRGNFYluFgs3HKiayhslKe8es1350KqYolO1+K4b/HynRnlstCxHajjesr9PvUEXW1z7xaLBkye8zKsqPj3x8lLGy8bKB0atsywfu8XhUaJISk6D5XKD09N8vN+3FvO5IG8Wz1+O7vTUwdSCNxUGhsnpvrz0aKTIz8ahEqIGi0WDb3wjn9P778tGr3EWmuFvPC8IrWkstqSr6pXBHqO8A0Fn4G7cfPJELt02212zKUQHB743/qft4sKhmgm6k6CLBTktyzzxjg4YNnLx4AH1Rm/eDPYkL/qaX4dbtwoyihoxhVPrjWZvTQMAY9ruZqtxWywcTEFg55ZlF+qyls2DScM403bOjtf1FpDi8WP5MhNrPba2+IoRG6HWaijNI1jz6yF8nBJC03gRhqaxovdTKRlhpPkuFg7umXxDEIfQL7/s0QpEsG14YfnwoQzD6SnJFR7qDQ4OOKXL4+JCzmGTmKlzfJ4fADyTrOUmDbflBhjXHj0iNMI7ogYXF89nXNy4YbEthLS2t2XF3m01+OQnuXQguQ9RIxpgjaBYKWWSfZ9GXRqcnPDjbTaCgbhwaIVqDWdnhg3HlegmHKQr8YIcvt+1HpeXsrLNXV8MBJzghNHeY4LKxgt/t7NTKKspKA07OxZrgQ4XC75E4f4+MXQTYKjOnchbTN0yxd46xfRCXiPughEAqAXaePiQRDp0zoq0uy0cQnz6lGSD7mJab3tolwJeNo3t+HbeLi4Mm1sZmrBGF6bbe2BqGFWCTDk5ITSNFOG0+PjHeRkqjbe3R4yM6uRrLcuv2rTs2pboZr3mDhRGJ5OQQlQ7cQ9J8ZVCHjyQ8ejWLY8dJmIFdLyU8WTu7RGWwjosFrLjYj5v8fbbOXxNI9+M2vy+FdMNJHlTVY5JSw3NPWvQMMo7IK/53h6JRrTa8FHWkxNiLo8bHKaSwy/oGTl3KfHz4MTkeYu7kCM18jmrhtVXAdnzvrvrYBa8gV3XLauLAYD3jRY9AJJnz1qPxUJWnOUc5w1rsYdSOvzmXy+MFwg4f/7oESXW7ZiRnd/gmebDh4RamFNVObxXIFJOEASPAu/B/uhHDa5f5xktEV9iD4AoYG/eJHjhNiJpjZrGwyqeQK5ft3AuNwYAwkyAAXBMTmGXq2l4L8nJSUrYNPk1CVOahumMqBTqGW/5Ehl885uyMOLw8vZtQt3wXn7A4JVX+FxNqeSRtV5Uat5/3+D8Bo8Tc9NOcCL8O5TY49dIMsAAYEdIrQgl8YRDTnOeiTx4UDZSc7wMY7z0EqdslOnGfdQIeBkEH6dAfcfCibSxWMgn1SXF6tEjAi35swbfXPAe54cPCe5cMqI9vMBbLgT4eLoJ7fzcirxUbTa5xxbBM7UWBAuRwY3MAzvwKo6ugUCHXFuveWcMAGw2ssfZZuX8OtqYT2kjtJMTwjIrWzUoABzuAcByKRuczvFOCJ63hNY0/OHsgwPC7q4Usm+wy6S2lcY7PU3L0Y3f7xT4hCTjv2PhRF4/m8l049w0ZE9XwmBVg5s3mepdSsYjaz2ahucTgcfm33o0ujxjEmGapzgxbu/alnVcXF56kU9sbVkWxx4+5PjloJu8/76EE5K8gShveJwo0+7BgSzzLi5kg9O5hnU0XF5yMqAbvcBb6prXGZSCKG+8lw/5S2v0+DHBn/EySk6zItT1RmN/nwc+5MHw+bt1PUXM6HWRGWNVbVjGc3rKKWpXj3f7Nr8Yt28Tzs8FBW/XycI3I8Tu+cLhtjDfkJ/FwecTGMbfaVsr1m49P2/x2mt8CsDtLen2m9SQGX9LWqPTUw/3+/w6vPuuw3d9l5THyY8XPMr8eOdLWXhIBtjpvmU8umGMxaJlPdhAWKOxodApXc4ABzwenZ/z3sWDA8JLL/FMbmenhRSmbhqesAMt8Xh0fm6Bt2T4uINqp6fyGp2ft2zINLRL9unFhRV5gTSeUuX5Snh5cWGfm272Wot33+XhW695BYqHITJniXZlunntNS/ylr0LmwiCXLHnWom31Dd53ndwQKg+LvECxxhgZRgODjj+EX4/8QkjRlbOz3m6BjheNdCuhJciLziV+dtyyfPLgwNZBiwWTqSbnR2ZtzRNw/OWTxgAUpif5y0PHpCo+AUewcPw0ku88v6i85Vk/M2bruNx6d8OOCHRTdPwCtR+iZ+vZV4qyTwevtB4Pga8Bs77Gfq2rUVV8XS4WEs4K/MW5wxOT4UDlAK/xFsuyAEOhsVV8obHieWSxwmJdh88kGXyYiHrTrmcjDDIvMU5IxqIL73E50zz37paL5DmtL9P4pzOz3nlHei93lwAD3j99Up4p0DE97l/X4vjhXf8c+ld+M7zjQeo4rvyfPkmzff11yvhW0ocrzRfCbbYT4Kt9C25Pf+al9aovE/8ux/7sfpbOl5pHaQ9fJE1L8FQei6v3/PDUOon067cp7TvYZ++dfOV90MVcOIqXsCP9yK84EXW/OpvvUgffk4lPHp+PJdhKOFECWf//4znLypvXoRuXoRfvti6lscryS+JDr+1OPFiePQi8uFF4CviRIEOS3rQi8j4Ih69gPx6kTW/f1/mv2W9j+/zInhUxvP/72Uykfq/Aa9DXt2EhjZkAAAAAElFTkSuQmCC';
  var DIG_LABEL = { open: 'حفر مفتوح', horizontal: 'ثقب أفقي', micro: 'حفر دقيق' };
  var DIG_WORKS = { open: 'حفر مفتوح', horizontal: 'حفر ثقب أفقي', micro: 'حفر دقيق' };
  var DIG_ORDER = ['horizontal', 'open', 'micro'];
  var DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var HIJRI_MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  var DEPARTMENTS = ['المحاور الرئيسية', 'محاور النقل العام', 'الجسور والأنفاق'];
  var AMANA_SLOTS = [
    { key: 'electricity', title: 'رئيس قسم الكهرباء' },
    { key: 'floods', title: 'رئيس قسم السيول' },
    { key: 'roads', title: 'رئيس قسم الطرق' },
    { key: 'manager', title: 'مدير إدارة تشغيل وصيانة' },
    { key: 'services', title: 'مدير إدارة خدمات تشغيل وصيانة المحاور والجسور والأنفاق' }
  ];
  var ASSET_FILES = {
    'amana': 'amana.png', 'green-riyadh': 'green-riyadh.png', 'rcrc': 'rcrc.png',
    'amana-crest': 'amana-crest.png', 'header-fringe': 'header-fringe.png', 'header-fringe-a4': 'header-fringe-a4.png'
  };
  var PLACEHOLDER = '..........';

  /* ---------- helpers ---------- */
  function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function deepFreeze(o) {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.keys(o).forEach(function (k) { deepFreeze(o[k]); }); }
    return o;
  }
  /* objects coming from the Center / forms ({name,...}) are coerced to their display name, never "[object Object]" */
  function txt(v) {
    if (v == null) return '';
    if (typeof v === 'object') {
      if (Array.isArray(v)) return v.map(txt).filter(Boolean).join('، ');
      var k = ['name', 'fullName', 'nameAr', 'name_ar', 'arabicName', 'title', 'label', 'text', 'value', 'companyName', 'displayName'];
      for (var i = 0; i < k.length; i++) { if (v[k[i]] != null && typeof v[k[i]] !== 'object' && String(v[k[i]]).trim() !== '') return String(v[k[i]]); }
      return '';
    }
    return String(v);
  }
  function esc(s) {
    return txt(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toEnDigits(s) {
    return txt(s).replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 0x0660; })
      .replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 0x06F0; });
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function squash(s) { return txt(s).replace(/\s+/g, ' ').trim(); }
  function normName(s) {
    return toEnDigits(squash(s)).replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();
  }
  /** licence duration (مدة الرخصة) -> whole days. Accepts 90, "90", "٩٠", "90 يوم", "90 يوماً", "3 أشهر", "2 أسبوع"; anything else -> null. */
  function parseDuration(v) {
    if (v == null || typeof v === 'boolean') return null;
    if (typeof v === 'number') return isFinite(v) && v > 0 && v < 100000 ? Math.round(v) : null;
    var s = toEnDigits(txt(v)).replace(/[,،]/g, '').trim();
    if (!s) return null;
    var m = s.match(/(\d+(?:\.\d+)?)/);
    if (!m) return null;
    var n = parseFloat(m[1]);
    if (/شهر|أشهر|اشهر|month/i.test(s)) n *= 30; else if (/أسبوع|اسبوع|أسابيع|اسابيع|week/i.test(s)) n *= 7;
    n = Math.round(n);
    return n > 0 && n < 100000 ? n : null;
  }
  var DURATION_KEYS = ['durationDays', 'duration_days', 'licenseDuration', 'licenceDuration', 'licenseDurationDays', 'permitDuration', 'duration', 'مدة الرخصة', 'مدة الترخيص', 'مدة الرخصه', 'مدة التنفيذ', 'مدة العمل', 'مدة الرخصة (يوم)', 'مدة الرخصة بالأيام'];
  /** durationDays of a licence / request / Rasid licence record (also looks inside raw_payload / rawPayload / snapshot) */
  function durationOf(o) {
    if (!o || typeof o !== 'object') return null;
    var boxes = [o, o.raw_payload, o.rawPayload, o.snapshot, o.raw];
    for (var b = 0; b < boxes.length; b++) {
      var box = boxes[b]; if (!box || typeof box !== 'object') continue;
      for (var i = 0; i < DURATION_KEYS.length; i++) { var d = parseDuration(box[DURATION_KEYS[i]]); if (d) return d; }
    }
    return null;
  }
  function err(code, message, extra) { var e = new Error(message); e.code = code; if (extra) e.details = extra; return e; }

  function normalizeDigType(v) {
    var s = normName(v);
    if (!s) return null;
    if (/(^|[^a-z])(open|trench|open_cut|opencut)/.test(s) || s.indexOf('مفتوح') >= 0) return 'open';
    if (/horizontal|hdd|directional|bore/.test(s) || s.indexOf('افقي') >= 0 || s.indexOf('ثقب') >= 0 || s.indexOf('موجه') >= 0) return 'horizontal';
    if (/micro/.test(s) || s.indexOf('دقيق') >= 0) return 'micro';
    return null;
  }

  /* ---------- dates ---------- */
  function parseDate(d) {
    var y, m, day;
    if (d == null || d === '') d = new Date();
    if (d instanceof Date) { y = d.getFullYear(); m = d.getMonth() + 1; day = d.getDate(); }
    else {
      var t = toEnDigits(d).trim(), r;
      if ((r = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/.exec(t))) { y = +r[1]; m = +r[2]; day = +r[3]; }
      else if ((r = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(t))) { day = +r[1]; m = +r[2]; y = +r[3]; }
      else throw err('BAD_DATE', 'التاريخ غير صالح');
    }
    if (!(m >= 1 && m <= 12 && day >= 1 && day <= 31)) throw err('BAD_DATE', 'التاريخ غير صالح');
    return { y: y, m: m, d: day };
  }
  function dayNameAr(date) {
    var p = parseDate(date);
    return DAY_NAMES[new Date(Date.UTC(p.y, p.m - 1, p.d, 12)).getUTCDay()];
  }
  function hijriString(date) {
    try {
      var p = parseDate(date);
      var parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
        .formatToParts(new Date(Date.UTC(p.y, p.m - 1, p.d, 12)));
      var o = {}; parts.forEach(function (x) { o[x.type] = x.value; });
      var mo = +o.month, yr = parseInt(o.year, 10);
      if (!(mo >= 1 && mo <= 12) || !(yr > 1300)) return null;
      return pad2(+o.day) + ' ' + HIJRI_MONTHS[mo - 1] + ' ' + yr;
    } catch (e) { return null; }
  }

  /* ---------- seeds ---------- */
  function seedTemplates() { return clone(SEED_JSON); }
  function seedPeople() {
    var main = { electricity: 'محمد بن خالد المالكي', floods: 'ياسر محمد النخيش', roads: 'جامع بن عبد الرحمن العتيبي', manager: 'ريان بن محمد الجلال', services: 'محمد بن صالح القرعاوي' };
    var out = [];
    DEPARTMENTS.forEach(function (dep, di) {
      AMANA_SLOTS.forEach(function (s, i) {
        out.push({ id: 'seed-' + di + '-' + s.key, department: dep, slot: s.key, title: s.title, name: di === 0 ? main[s.key] : '', sortOrder: i, active: true });
      });
    });
    return out;
  }

  /* ---------- resolver ---------- */
  function ownerKeyOf(owner) {
    var s = normName(owner);
    if (!s) return 'generic';
    if (s.indexOf('الرياض الخضراء') >= 0 || s.indexOf('green riyadh') >= 0 || s.indexOf('greenriyadh') >= 0) return 'green_riyadh';
    if (s.indexOf('الهيئه الملكيه') >= 0 || s.indexOf('rcrc') >= 0 || s.indexOf('royal commission') >= 0) return 'rcrc';
    if (s.indexOf('المسار الرياضي') >= 0 || s.indexOf('sports boulevard') >= 0) return 'masar';
    if (s.indexOf('الدرعيه') >= 0 || s.indexOf('diriyah') >= 0) return 'diriyah';
    return 'generic';
  }
  function usable(t) { return t && t.active !== false && t.status === 'مرفوع' && t.clauses && t.clauses.length; }
  function covers(t, types) { return !types.length || types.every(function (x) { return (t.digTypes || []).indexOf(x) >= 0; }); }
  function modeOk(t, merged) { return t.mode === 'both' || t.mode === (merged ? 'merged' : 'single'); }

  /** resolveTemplate({owner,digTypes,merged,override,templates}) -> {template, reason}. Order: override → owner → digType → single/merged → generic fallback. */
  function resolveTemplate(opts) {
    opts = opts || {};
    var all = opts.templates || seedTemplates();
    var types = (opts.digTypes || []).map(function (x) { return normalizeDigType(x) || x; }).filter(Boolean);
    types = types.filter(function (x, i) { return types.indexOf(x) === i; });
    var merged = !!opts.merged;
    if (opts.override) {
      var ov = all.filter(function (t) { return t.id === opts.override; })[0];
      if (ov) return { template: ov, reason: 'اختيار يدوي للنموذج' };
    }
    var key = ownerKeyOf(opts.owner), note = '';
    if (key !== 'generic') {
      var cands = all.filter(function (t) { return t.ownerKey === key; });
      if (cands.length && !cands.some(usable)) note = 'نموذج الجهة المالكة غير مرفوع بعد، استُخدم النموذج العام. ';
      else {
        var pick = cands.filter(function (t) { return usable(t) && covers(t, types) && modeOk(t, merged); })[0];
        if (pick) return { template: pick, reason: 'نموذج الجهة المالكة (' + pick.ownerLabel + ')' + (merged ? ' — محضر مدمج' : '') };
        if (cands.some(usable)) note = 'نموذج الجهة المالكة لا يغطي ' + (merged ? 'المحضر المدمج' : 'نوع الحفر المطلوب') + '، استُخدم النموذج العام. ';
      }
    }
    var gens = all.filter(function (t) { return t.ownerKey === 'generic' && usable(t); });
    var g;
    if (merged) g = gens.filter(function (t) { return t.mode === 'merged'; })[0];
    else {
      g = gens.filter(function (t) { return t.mode === 'single' && types.length && t.digTypes.length === 1 && covers(t, types); })[0] ||
        gens.filter(function (t) { return t.mode === 'single' && covers(t, types); }).sort(function (a, b) { return b.digTypes.length - a.digTypes.length; })[0];
    }
    g = g || gens[0];
    if (!g) throw err('NO_TEMPLATE', 'لا يوجد نموذج متاح');
    return { template: g, reason: note + 'النموذج العام ' + (merged ? 'للمحضر المدمج' : 'للمحضر المنفرد') };
  }

  /* ---------- licences ---------- */
  function normLicence(l) {
    return {
      licenseNumber: toEnDigits(squash(l.licenseNumber != null ? l.licenseNumber : l.licenceNumber)),
      digType: normalizeDigType(l.digType) || squash(l.digType) || null,
      road: squash(l.road), lengthM: l.lengthM == null || l.lengthM === '' ? null : Number(toEnDigits(l.lengthM)),
      project: squash(l.project), contractor: squash(l.contractor), owner: squash(l.owner),
      durationDays: durationOf(l),
      requestIds: [].concat(l.requestIds || (l.requestId != null ? [l.requestId] : (l.id != null ? [l.id] : [])))
    };
  }
  /** collapse duplicates by licence number; keep every request id; identical segments collapse, different roads stay as segments */
  function dedupeLicences(list) {
    var map = {}, order = [];
    (list || []).forEach(function (raw) {
      var l = normLicence(raw);
      if (!l.licenseNumber) return;
      var cur = map[l.licenseNumber];
      if (!cur) {
        cur = map[l.licenseNumber] = { licenseNumber: l.licenseNumber, digType: l.digType, road: l.road, lengthM: l.lengthM, project: l.project, contractor: l.contractor, owner: l.owner, durationDays: null, requestIds: [], segments: [] };
        order.push(cur);
      }
      ['project', 'contractor', 'owner'].forEach(function (k) { if (!cur[k] && l[k]) cur[k] = l[k]; });
      if (l.durationDays && (!cur.durationDays || l.durationDays > cur.durationDays)) cur.durationDays = l.durationDays;
      l.requestIds.forEach(function (id) { if (cur.requestIds.indexOf(id) < 0) cur.requestIds.push(id); });
      var seg = { digType: l.digType, road: l.road, lengthM: l.lengthM };
      var dup = cur.segments.some(function (s) { return s.digType === seg.digType && normName(s.road) === normName(seg.road) && s.lengthM === seg.lengthM; });
      if (!dup) {
        // a segment missing road/length is absorbed by one that has it
        var sub = cur.segments.filter(function (s) { return s.digType === seg.digType && (!seg.road || normName(s.road) === normName(seg.road) || !s.road) && !(s.road && seg.road && normName(s.road) !== normName(seg.road)); })[0];
        if (sub && (!sub.road || !seg.road) && (sub.lengthM == null || seg.lengthM == null || sub.lengthM === seg.lengthM)) {
          if (!sub.road) sub.road = seg.road; if (sub.lengthM == null) sub.lengthM = seg.lengthM;
        } else cur.segments.push(seg);
      }
    });
    order.forEach(function (l) { l.digType = l.segments[0].digType; l.road = l.segments[0].road; l.lengthM = l.segments[0].lengthM; });
    return order;
  }
  /** validateMerge(licences) -> {ok, code?, message?, contractors[], licenceCount} (different contractors cannot be merged) */
  function validateMerge(licences) {
    var seen = {}, names = [];
    (licences || []).forEach(function (l) {
      var c = squash(l.contractor); if (!c) return;
      var k = normName(c); if (!seen[k]) { seen[k] = 1; names.push(c); }
    });
    var count = dedupeLicences(licences).length;
    if (names.length > 1) return { ok: false, code: 'MIXED_CONTRACTORS', message: 'لا يمكن دمج رخص تابعة لأكثر من مقاول في محضر واحد.', contractors: names, licenceCount: count };
    return { ok: true, contractors: names, licenceCount: count };
  }

  /* ---------- clauses ---------- */
  var LAYER_RANK = { base: 0, owner: 1, dig: 2, merged: 3, user: 4 };
  function renumberClauses(list) {
    var n = 0;
    return list.map(function (c) { var o = Object.assign({}, c); if (o.enabled !== false) { n += 1; o.number = n; } else o.number = null; return o; });
  }
  function clauseApplies(c, types) {
    var a = c.applicableDigTypes || ['*'];
    if (a.indexOf('*') >= 0 || !types.length) return true;
    return types.some(function (t) { return a.indexOf(t) >= 0; });
  }
  function layerClauses(template, types, merged, userClauses, durationDays) {
    // layering: base → owner → dig → merged → user. A later layer replaces an earlier clause with the same key.
    var byKey = {}, list = [];
    (template.clauses || []).filter(function (c) { return c.enabled !== false && clauseApplies(c, types); })
      .sort(function (a, b) { return (LAYER_RANK[a.layer] || 0) - (LAYER_RANK[b.layer] || 0) || a.order - b.order; })
      .forEach(function (c) {
        var o = clone(c);
        if (merged === false && o.layer === 'merged' && c.key && byKey[c.key] === undefined) { /* merged clause in single minute: keep (template defines it) */ }
        if (c.key && byKey[c.key] !== undefined) list[byKey[c.key]] = o; else { if (c.key) byKey[c.key] = list.length; list.push(o); }
      });
    list.sort(function (a, b) { return a.order - b.order; });
    var maxOrder = list.reduce(function (m, c) { return Math.max(m, c.order || 0); }, 0);
    (userClauses || []).forEach(function (u, i) {
      var text = typeof u === 'string' ? u : u.text; if (!squash(text)) return;
      list.push({ id: (u && u.id) || ('user:' + (i + 1)), templateId: template.id, key: 'user' + (i + 1), number: 0, text: squash(text), bold: [], enabled: true,
        order: maxOrder + (i + 1) * 10, applicableDigTypes: ['*'], isMandatory: false, layer: 'user', version: 1 });
    });
    list.forEach(function (c) { fillDuration(c, durationDays); });
    return renumberClauses(list);
  }

  /** {duration} placeholder -> licence duration; unknown -> visible, editable "____". Legacy clause text "قدرها (90) يوماً" is overwritten only when the days are known. */
  var DUR_RE = /قدرها \([^)]*\) يوماً/;
  function fillDuration(c, days) {
    var val = days ? String(days) : '____';
    if (/\{duration\}/.test(c.text)) { c.tplText = c.text; c.text = c.text.replace(/\{duration\}/g, val); }
    else if (c.key === 'duration' && days && DUR_RE.test(c.text)) c.text = c.text.replace(DUR_RE, 'قدرها (' + val + ') يوماً');
  }
  /** form.durationDays (coordinator override) > licence duration (merged: the longest, with a warning when they differ) */
  function resolveDuration(form, licences, warnings) {
    var ov = parseDuration(form && form.durationDays);
    if (ov) return { days: ov, source: 'form' };
    var ds = [], missing = [];
    licences.forEach(function (l) { if (l.durationDays) { if (ds.indexOf(l.durationDays) < 0) ds.push(l.durationDays); } else missing.push(l.licenseNumber); });
    if (!ds.length) return { days: null, source: 'missing' };
    var max = Math.max.apply(null, ds);
    if (ds.length > 1) warnings.push('اختلفت مدد الرخص المدمجة (' + ds.slice().sort(function (a, b) { return a - b; }).join('، ') + ' يوماً)؛ تم اعتماد الأطول (' + max + ' يوماً) في بند مدة التنفيذ.');
    if (missing.length && licences.length > 1) warnings.push('مدة الرخصة غير متوفرة للرخص: ' + missing.join('، ') + '؛ اعتُمدت مدة الرخص الأخرى.');
    return { days: max, source: ds.length > 1 ? 'longest' : 'licence' };
  }

  /* ---------- intro ---------- */
  function fmtLen(n) { return String(Math.round(n * 100) / 100); }
  function fillTpl(pattern, vars) {
    var text = '', html = '', i = 0, re = /\{(\w+)\}/g, m, last = 0;
    while ((m = re.exec(pattern))) {
      var lit = pattern.slice(last, m.index); text += lit; html += esc(lit); last = re.lastIndex;
      var v = vars[m[1]];
      if (v == null) { v = { t: '' }; }
      if (typeof v === 'string') v = { t: v };
      if (v.t === '' || v.t == null) continue;
      text += (v.pre || '') + v.t + (v.post || '');
      html += esc(v.pre || '') + (v.b ? '<b>' + esc(v.t) + '</b>' : esc(v.t)) + esc(v.post || '');
    }
    var rest = pattern.slice(last); text += rest; html += esc(rest);
    return { text: text.replace(/\s{2,}/g, ' '), html: html.replace(/\s{2,}/g, ' ') };
  }
  function roadVar(road) {
    if (!road) return { t: '' };
    return { pre: ' على ', t: /^طريق\s/.test(road) ? road : 'طريق ' + road, b: true };
  }
  function buildIntro(template, licences, form, warnings) {
    var merged = licences.length > 1;
    var contractor = licences.map(function (l) { return l.contractor; }).filter(Boolean)[0] || '';
    if (!contractor) warnings.push('اسم المقاول غير متوفر في الطلب');
    var cvar = { t: contractor || PLACEHOLDER, b: true };
    var rows = [], head, parts = {};
    if (!merged) {
      var l = licences[0], seg = l.segments[0];
      if (l.segments.length > 1) warnings.push('الرخصة ' + l.licenseNumber + ' تتضمن أكثر من مسار؛ يُعرض المسار الأول في المحضر المنفرد.');
      var open = seg.digType === 'open';
      var vars = {
        licenseNumber: { t: l.licenseNumber, b: false }, digLabel: { t: DIG_LABEL[seg.digType] || squash(seg.digType) || PLACEHOLDER, b: true },
        roadPart: roadVar(seg.road), projectPart: l.project ? { pre: ' ضمن مشروع ', t: l.project, b: true } : { t: '' },
        lengthPart: open && seg.lengthM ? { pre: ' ', t: 'بطول ' + fmtLen(seg.lengthM) + 'م', b: true } : { t: '' }, contractor: cvar
      };
      var h = fillTpl(template.introSingle.head, vars), t = fillTpl(template.introSingle.tail, vars);
      rows.push({ licenseNumber: l.licenseNumber, digType: seg.digType, road: seg.road, lengthM: open ? seg.lengthM : null, requestIds: l.requestIds.slice(), text: h.text, html: h.html });
      return { kind: 'single', text: h.text + '\n' + t.text, html: '<p>' + h.html + '</p><p>' + t.html + '</p>', licenceRows: rows, parts: { head: h.text, tail: t.text } };
    }
    var im = template.introMerged;
    var hd = fillTpl(im.head, {});
    var lis = [];
    licences.forEach(function (l) {
      l.segments.forEach(function (seg) {
        var open = seg.digType === 'open';
        var r = fillTpl(im.row, {
          licenseNumber: { t: l.licenseNumber }, digLabel: { t: DIG_LABEL[seg.digType] || squash(seg.digType) || PLACEHOLDER, b: true },
          roadPart: roadVar(seg.road), lengthPart: open && seg.lengthM ? { pre: ' ', t: 'بطول (' + fmtLen(seg.lengthM) + ') متر', b: true } : { t: '' }
        });
        rows.push({ licenseNumber: l.licenseNumber, digType: seg.digType, road: seg.road, lengthM: open ? seg.lengthM : null, requestIds: l.requestIds.slice(), text: r.text, html: r.html });
        lis.push(r);
      });
    });
    var projects = []; licences.forEach(function (l) { if (l.project && projects.indexOf(l.project) < 0) projects.push(l.project); });
    var wd = squash(form && form.worksDescription) || (projects.length ? 'ضمن مشروع ' + projects.join('، ') : '') || 'حفر';
    var body = fillTpl(im.body, { worksDescription: { t: wd, b: true }, contractor: cvar });
    var tail = fillTpl(im.tail, { contractor: cvar });
    return {
      kind: 'merged', text: [hd.text].concat(lis.map(function (x) { return '- ' + x.text; }), [body.text, tail.text]).join('\n'),
      html: '<p>' + hd.html + '</p><ul>' + lis.map(function (x) { return '<li>' + x.html + '</li>'; }).join('') + '</ul><p>' + body.html + '</p><p>' + tail.html + '</p>',
      licenceRows: rows, parts: { head: hd.text, body: body.text, tail: tail.text }
    };
  }

  /* ---------- parties ---------- */
  function matchPerson(people, dept, slot) {
    var kw = { electricity: 'الكهرباء', floods: 'السيول', roads: 'الطرق', manager: 'مدير إدارة تشغيل', services: 'خدمات' }[slot];
    var c = (people || []).filter(function (p) { return p && p.active !== false && (!p.department || p.department === dept); });
    return c.filter(function (p) { return p.slot === slot; })[0] ||
      c.filter(function (p) { return !p.slot && p.title && normName(p.title).indexOf(normName(kw)) >= 0 && (slot !== 'manager' || normName(p.title).indexOf('خدمات') < 0); })[0] || null;
  }
  function buildParties(template, licences, form, dept, people, warnings, extraDepts) {
    form = form || {};
    var ownerName = squash(form.ownerName) || (licences.map(function (l) { return l.owner; }).filter(Boolean)[0] || '');
    var contractor = licences.map(function (l) { return l.contractor; }).filter(Boolean)[0] || '';
    var owner = [], amana = [];
    var generic = template.ownerKey === 'generic';
    (template.parties || []).forEach(function (p) {
      if (p.section === 'owner') {
        var o = { key: p.key, row: p.row, label: p.label, company: '', person: '', needsCompany: p.key !== 'owner' || template.ownerKey === 'generic' };
        if (p.key === 'contractor') { o.company = contractor; o.person = squash(form.contractorRep); }
        else if (p.key === 'consultant') { o.company = squash(form.consultantCompany); o.person = squash(form.consultantRep); }
        else { o.company = generic ? ownerName : ''; o.person = squash(form.ownerRep); }
        owner.push(o);
      } else if (p.section === 'amana') {
        var per = matchPerson(people, dept, p.key);
        if (!per || !squash(per.name)) warnings.push('لا يوجد معني مسجل لـ «' + p.title.replace('{dept}', dept) + '»');
        amana.push({ key: p.key, row: p.row, col: p.col, title: p.title.replace('{dept}', dept), name: per ? squash(per.name) : '', personId: per ? per.id : null });
      }
    });
    // additional departments chosen for the minutes: their Amana signers follow the primary department's block (same template layout), duplicates skipped
    var maxRow = amana.reduce(function (m, a) { return Math.max(m, a.row || 0); }, 0), seen = {};
    amana.forEach(function (a) { seen[normName(a.title) + '|' + normName(a.name)] = 1; });
    (extraDepts || []).forEach(function (xd) {
      var added = 0, base = maxRow + 1, top = 0;
      (template.parties || []).forEach(function (p) {
        if (p.section !== 'amana') return;
        var per = matchPerson(people, xd, p.key);
        if (!per || !squash(per.name)) return;
        var title = p.title.replace('{dept}', xd), k = normName(title) + '|' + normName(per.name);
        if (seen[k]) return; seen[k] = 1;
        amana.push({ key: p.key, row: base + (p.row || 0), col: p.col, title: title, name: squash(per.name), personId: per.id, department: xd });
        top = Math.max(top, base + (p.row || 0)); added++;
      });
      if (!added) warnings.push('لا يوجد معنيون مسجلون لإدارة «' + xd + '» لإضافة توقيعاتهم.');
      else maxRow = top;
    });
    return { owner: owner, amana: amana };
  }

  /* ---------- minutes ---------- */
  function titleFor(template, types) {
    var pattern = template.titlePattern || 'محضر تنسيقي لأعمال {digTitle}';
    var digTitle = 'الحفر';
    if (types.length === 1) digTitle = types[0] === 'horizontal' ? 'تنفيذ حفر ثقب أفقي' : types[0] === 'micro' ? 'تنفيذ حفر دقيق' : 'الحفر';
    var list = DIG_ORDER.filter(function (t) { return types.indexOf(t) >= 0; }).map(function (t) { return DIG_LABEL[t]; }).join('/ ');
    return pattern.replace('{digTitle}', digTitle).replace('{digList}', list || 'ثقب أفقي/ حفر مفتوح');
  }
  function buildMinutes(opts) {
    opts = opts || {};
    var form = opts.form || {}, warnings = [];
    var all = [];
    (opts.licences || []).forEach(function (l) { all.push(l); });
    (opts.requests || []).forEach(function (r) { if (r && (r.licenseNumber || r.licenceNumber)) all.push(r); });
    var vm = validateMerge(all);
    if (!vm.ok) throw err('MIXED_CONTRACTORS', vm.message, { contractors: vm.contractors });
    var licences = dedupeLicences(all);
    if (!licences.length) throw err('NO_LICENCES', 'لا توجد رخص لإنشاء المحضر');
    var types = [];
    licences.forEach(function (l) { l.segments.forEach(function (s) { if (s.digType && DIG_LABEL[s.digType] && types.indexOf(s.digType) < 0) types.push(s.digType); }); });
    var merged = licences.length > 1;
    var template = opts.template;
    if (!template) {
      var rs = resolveTemplate({ owner: opts.owner || licences[0].owner, digTypes: types, merged: merged, override: opts.override, templates: opts.templates });
      template = rs.template;
    }
    if (!template.clauses || !template.clauses.length) throw err('TEMPLATE_EMPTY', 'النموذج المختار غير مرفوع بعد');
    var deptList = [].concat(opts.departments || []).map(squash).filter(Boolean);
    var dept = squash(opts.department) || deptList[0] || squash(form.department) || DEPARTMENTS[0];
    deptList = [dept].concat(deptList.filter(function (d, i, a) { return d !== dept && a.indexOf(d) === i; }));
    var p = parseDate(opts.date);
    var iso = p.y + '-' + pad2(p.m) + '-' + pad2(p.d);
    var showHijri = form.showHijri != null ? !!form.showHijri : !!template.showHijri;
    var hijri = showHijri ? hijriString(iso) : null;
    var greg = pad2(p.d) + '-' + pad2(p.m) + '-' + p.y;
    var display = hijri ? hijri + 'هـ الموافق ' + p.y + '/' + pad2(p.m) + '/' + pad2(p.d) + 'م' : greg + 'م';
    var intro = buildIntro(template, licences, form, warnings);
    var dur = resolveDuration(form, licences, warnings);
    var clauses = layerClauses(template, types, merged, opts.userClauses || form.userClauses, dur.days);
    var durClause = clauses.filter(function (c) { return c.enabled !== false && (c.tplText || c.key === 'duration'); })[0];
    var open = clauses.filter(function (c) { return /\(\*+\)/.test(c.text); });
    if (!dur.days && durClause) warnings.push('مدة الرخصة غير متوفرة في بيانات الرخصة؛ أدخل مدة التنفيذ (بالأيام) في البند ' + durClause.number + ' أو من حقل «مدة التنفيذ».');
    else if (open.length) warnings.push('يلزم إدخال مدة التنفيذ (بالأيام) في البند ' + open[0].number);
    if (types.length === 0) warnings.push('نوع الحفر غير محدد');
    var works = 'تنفيذ أعمال ' + DIG_ORDER.concat([]).filter(function (t) { return types.indexOf(t) >= 0; }).sort(function (a, b) { return ['open', 'horizontal', 'micro'].indexOf(a) - ['open', 'horizontal', 'micro'].indexOf(b); }).map(function (t) { return DIG_WORKS[t]; }).join(' - ');
    var minutes = {
      number: opts.number || null,
      mode: merged ? 'merged' : 'single',
      date: { gregorian: greg, iso: iso, hijri: hijri, dayName: dayNameAr(iso), display: display },
      worksLabel: works, titleText: titleFor(template, types),
      digTypes: types, department: dept, departments: deptList, durationDays: dur.days || null, durationSource: dur.source,
      contractor: licences.map(function (l) { return l.contractor; }).filter(Boolean)[0] || '',
      intro: intro, licences: licences,
      requestIds: licences.reduce(function (a, l) { l.requestIds.forEach(function (i) { if (a.indexOf(i) < 0) a.push(i); }); return a; }, []),
      clauses: clauses, parties: buildParties(template, licences, form, dept, opts.people, warnings, deptList.slice(1)),
      templateId: template.id, templateVersion: template.version,
      templateSnapshot: deepFreeze(clone(template)), warnings: warnings
    };
    return minutes;
  }

  /* ---------- HTML rendering ---------- */
  var CSS = [
    '@page{size:A4;margin:5mm 10mm 17mm 10mm}',
    ':root{--g:#006946;--g2:#167659;--ink:#000}',
    'table.pg,table.pg>thead>tr>td,table.pg>tbody>tr>td{border:0;padding:0;text-align:right;vertical-align:top}table.pg>thead{display:table-header-group}',
    '*{box-sizing:border-box}',
    'html,body{margin:0;padding:0;background:#fff}',
    'body{direction:rtl;font-family:"Sakkal Majalla","Majalla","Amiri","Noto Naskh Arabic","Traditional Arabic","DejaVu Sans",serif;font-size:12pt;line-height:1.1;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}',
        'table{border-collapse:collapse;width:100%;table-layout:fixed}',
    'td,th{border:.75pt solid #000;padding:.6mm 2mm;vertical-align:middle;font-weight:400;text-align:center}',
    '.gbar{background:var(--g);color:#fff;font-weight:700;text-align:center}',
    '.gap{height:2.2mm}',
    '.run-hdr{padding-bottom:2.5mm}',
    '.run-ftr{display:none}',
    '.hdr-logos{display:flex;justify-content:space-between;align-items:flex-start;direction:rtl}',
    '.hdr-logos .r{display:flex;flex-direction:column;align-items:flex-start}',
    '.hdr-logos img{display:block;height:13.5mm}',
    '.hdr-logos img.lf,.hdr-crest img.lf{height:13.5mm;width:auto;max-width:60mm;object-fit:contain;object-position:left top}',
    '.hdr-crest img.lf{margin-inline-start:auto}',
    '.hdr-sub{font-size:9pt;margin-top:.8mm;color:#222;white-space:nowrap}',
    '.hdr-crest{display:flex;align-items:center;gap:3mm;height:21mm;direction:rtl}',
    '.hdr-crest img{height:19mm}.hdr-crest .tx{font-size:9.5pt;color:#444;letter-spacing:.6mm;line-height:1.25}',
    '.t-title th{background:var(--g);color:#fff;font-weight:700;font-size:14pt;padding:.8mm 2mm}',
    '.t-info td.l{background:var(--g);color:#fff;font-weight:700;width:20%}',
    '.t-info td.v{font-weight:700}',
    '.intro-bar th{background:var(--g);color:#fff;font-weight:700}',
    '.intro-cell{text-align:justify;text-align-last:right;padding:1mm 2.2mm;font-size:12pt;line-height:1.2}',
    '.intro-cell p{margin:0 0 1.2mm}.intro-cell ul{margin:.6mm 0 2mm;padding:0 6mm 0 0;list-style:disc}.intro-cell li{margin:0 0 .9mm}',
    '.cl{margin-top:2mm}',
    '.cl .nocell{border:0;width:8mm;background:#fff;font-weight:700;color:#000;padding:0 0 0 .6mm}',
    '.cl th.h{background:var(--g);color:#fff;font-weight:700}',
    '.cl td.n{width:8mm;font-size:12pt;padding:0}',
    '.cl td.tx{text-align:justify;padding:.5mm 2mm;font-size:12pt;line-height:1.15}',
    '.cl tr{break-inside:avoid}.cl thead{display:table-header-group}.cl tbody.tail{break-inside:avoid}',
    '.cl td.sigcell{border:0;padding:0;text-align:center}',
    '.signoff{text-align:center;font-weight:700;font-size:14pt;margin:3.5mm 0 2.2mm}',
    '.sig{margin:0 0 1.5mm}','.sig tr{break-inside:avoid}',
    '.sig td{border:0;padding:1mm 2mm;text-align:center;vertical-align:top;font-size:12pt;line-height:1.1}',
    '.sig .gh{background:var(--g);color:#fff;font-weight:700;border:0;padding:.3mm 2mm;text-align:center}',
    '.sig .cell{height:30mm}',
    '.sig .cell .sp{height:15mm}',
    '.keep{break-inside:avoid}',
    '@media screen{body{background:#e8ece9;padding:8mm 0}.sheet{width:210mm;margin:0 auto 8mm;background:#fff;padding:5mm 10mm 0;box-shadow:0 1px 8px rgba(0,0,0,.2)}.run-ftr{display:block;margin:6mm -10mm 0}.run-ftr img{width:100%;display:block}}',
    '@media print{.sheet{padding:0}}'
  ].join('\n');

  function boldify(text, phrases) {
    var h = esc(text);
    (phrases || []).forEach(function (p) { var e = esc(p); var i = h.indexOf(e); if (e && i >= 0) h = h.slice(0, i) + '<b>' + e + '</b>' + h.slice(i + e.length); });
    return h;
  }
  function renderHtml(minutes, opts) {
    opts = opts || {};
    var base = (opts.assetBase == null ? '' : String(opts.assetBase)).replace(/\/+$/, '');
    var asset = function (key) {
      if (!key) return '';
      if (ASSET_FILES[key]) return esc(base + '/coord/' + ASSET_FILES[key]);
      if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+\/=]+$/i.test(key) || /^https?:\/\/[^\s"'<>]+$/i.test(key)) return esc(key);   // owner logo uploaded from the templates manager
      return '';
    };
    var fontUrl = function (f) { return esc(base + '/coord/fonts/' + f); };
    var snap = minutes.templateSnapshot || {}, hd = snap.header || { kind: 'logos' }, logos = snap.logos || {};
    var crest = hd.kind === 'crest';
    var d = minutes.date || {};
    var dateText = d.display || ((d.gregorian || '') + 'م');
    var out = [];
    out.push('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">');
    out.push('<title>' + esc('محضر تنسيقي' + (minutes.number ? ' ' + minutes.number : '')) + '</title><style>');
    out.push('@font-face{font-family:"Sakkal Majalla";font-weight:400;src:local("Sakkal Majalla"),local("SakkalMajalla"),url("' + fontUrl('SakkalMajalla-Regular.ttf') + '") format("truetype")}');
    out.push('@font-face{font-family:"Sakkal Majalla";font-weight:700;src:local("Sakkal Majalla Bold"),local("SakkalMajalla-Bold"),url("' + fontUrl('SakkalMajalla-Bold.ttf') + '") format("truetype")}');
    out.push(CSS + '@page{@bottom-center{content:counter(page);width:190mm;vertical-align:top;padding-top:1mm;text-align:center;background:url("' + FRINGE_A4 + '") center bottom/100% auto no-repeat;font-family:"Sakkal Majalla","Majalla","Amiri","Noto Naskh Arabic","DejaVu Sans",serif;font-size:11pt;color:#006946}}</style></head><body class="' + (crest ? 'crest-kind' : 'logo-kind') + '"><div class="sheet"><table class="pg"><thead><tr><td>');
    var infoRows = '<tr><td class="l">التاريخ</td><td class="v">' + esc(dateText) + '</td></tr><tr><td class="l">اليوم</td><td class="v">' + esc(d.dayName || '') + '</td></tr>' +
      (snap.showWorksRow === false ? '' : '<tr><td class="l">نوع الأعمال</td><td class="v">' + esc(minutes.worksLabel || '') + '</td></tr>');
    var titleTable = '<table class="t-title t-info"><colgroup><col style="width:20%"><col></colgroup><tr class="t-title"><th colspan="2">' + esc(minutes.titleText) + '</th></tr>' + infoRows + '</table>';
    if (crest) {
      out.push('<div class="run-hdr"><div class="hdr-crest">' + (logos.right ? '<img src="' + asset(logos.right) + '" alt="">' : '') +
        '<div class="tx">' + (hd.crestText || []).map(esc).join('<br>') + '</div>' + (asset(logos.left) ? '<img class="lf" src="' + asset(logos.left) + '" alt="">' : '') + '</div>' + titleTable + '</div>');
    } else {
      out.push('<div class="run-hdr"><div class="hdr-logos"><div class="r">' + (logos.right ? '<img src="' + asset(logos.right) + '" alt="">' : '') +
        (hd.subtitle ? '<div class="hdr-sub">' + esc(hd.subtitle) + '</div>' : '') + '</div>' +
        (asset(logos.left) ? '<img class="lf" src="' + asset(logos.left) + '" alt="">' : '<span></span>') + '</div></div>');
    }
    out.push('</td></tr></thead><tbody><tr><td>');
    out.push('<main>');
    if (!crest) out.push(titleTable + '<div class="gap"></div>');
    out.push('<table class="intro"><tr class="intro-bar"><th>مقدمة</th></tr><tr><td class="intro-cell">' + (minutes.intro && minutes.intro.html || '') + '</td></tr></table>');
    var crows = [], n = 0;
    (minutes.clauses || []).forEach(function (c) {
      if (c.enabled === false) return; n += 1;
      crows.push('<tr><td class="n">' + n + '</td><td class="tx">' + boldify(c.text, c.bold) + '</td></tr>');
    });
    // the last 2 clause rows travel with the signature block (never an orphaned signature page); each row is also unbreakable
    var tailN = Math.min(2, crows.length);
    out.push('<table class="cl"><colgroup><col style="width:8mm"><col></colgroup><thead><tr><td class="nocell">م</td><th class="h">المسؤوليات</th></tr></thead>');
    if (crows.length - tailN) out.push('<tbody>' + crows.slice(0, crows.length - tailN).join('') + '</tbody>');
    out.push('<tbody class="tail">' + crows.slice(crows.length - tailN).join('') + '<tr class="sigrow"><td colspan="2" class="sigcell">');
    // signatures
    var P = minutes.parties || { owner: [], amana: [] };
    var cell = function (label, name, colspan) {
      return '<td class="cell"' + (colspan ? ' colspan="' + colspan + '"' : '') + '><div>' + label + '</div><div class="sp"></div><div>م / ' + (name && squash(name).replace(/^م\s*\/\s*/, '') ? esc(squash(name).replace(/^م\s*\/\s*/, '')) : PLACEHOLDER) + '</div></td>';
    };
    var rows = {}; (P.owner || []).forEach(function (o) { (rows[o.row] = rows[o.row] || []).push(o); });
    var ownerHtml = '<table class="sig"><tr><td class="gh" colspan="2">الجهة المالكة</td></tr>';
    Object.keys(rows).sort(function (a, b) { return a - b; }).forEach(function (r) {
      var list = rows[r];
      ownerHtml += '<tr>' + list.map(function (o) {
        var lab = esc(o.label) + (o.company ? ': ' + esc(o.company) : (o.needsCompany ? ' ' + PLACEHOLDER : ''));
        return cell(lab, o.person, list.length === 1 ? 2 : 0);
      }).join('') + '</tr>';
    });
    ownerHtml += '</table>';
    var signoffHtml = '<div class="signoff">وعلى ذلك جرى التوقيع ،،،،،،</div>' + ownerHtml;
    var ar = {}; (P.amana || []).forEach(function (a) { (ar[a.row] = ar[a.row] || []).push(a); });
    var amanaHtml = '<table class="sig"><colgroup><col><col><col></colgroup><tr><td class="gh" colspan="3">أمانة منطقة الرياض</td></tr>';
    Object.keys(ar).sort(function (a, b) { return a - b; }).forEach(function (r) {
      var cols = [null, null, null]; ar[r].forEach(function (a) { var c = +a.col; if (!(c >= 0 && c <= 2) || cols[c]) { c = cols.indexOf(null); } if (c >= 0) cols[c] = a; });
      amanaHtml += '<tr>' + cols.map(function (a) { return a ? cell(esc(a.title), a.name) : '<td class="cell"></td>'; }).join('') + '</tr>';
    });
    amanaHtml += '</table>';
    out.push('<div class="keep sigblock">' + signoffHtml + amanaHtml + '</div></td></tr></tbody></table></main></td></tr></tbody></table><div class="run-ftr"><img src="' + asset('header-fringe') + '" alt=""></div></div></body></html>');
    return out.join('\n');
  }

  return {
    seedTemplates: seedTemplates, seedPeople: seedPeople, resolveTemplate: resolveTemplate, buildMinutes: buildMinutes, renderHtml: renderHtml,
    normalizeDigType: normalizeDigType, dayNameAr: dayNameAr, hijriString: hijriString, validateMerge: validateMerge, dedupeLicences: dedupeLicences,
    renumberClauses: renumberClauses, ownerKeyOf: ownerKeyOf, toEnDigits: toEnDigits, parseDuration: parseDuration, durationOf: durationOf,
    DIG_LABEL: DIG_LABEL, DEPARTMENTS: DEPARTMENTS, AMANA_SLOTS: AMANA_SLOTS, ASSET_FILES: ASSET_FILES
  };
});
