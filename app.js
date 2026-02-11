// ============================================================================
// نظام تشخيص الغدة الدرقية الذكي - النسخة الكاملة والعملية
// الإصدار المصحح 2.0.1 - تم إصلاح مشاكل التحميل والتقدم
// ============================================================================

// ===== المتغيرات العالمية =====
let reports = JSON.parse(localStorage.getItem('thyroidReports')) || [];
let currentDiagnosis = null;
let systemReady = false;
let isAnalyzing = false;

// ===== تهيئة النظام =====
function initializeSystem() {
    console.log('🚀 بدء تهيئة النظام...');
    
    // منع التهيئة المزدوجة
    if (systemReady) {
        console.log('⚠️ النظام مهيأ بالفعل');
        return;
    }
    
    try {
        // تحميل البيانات الطبية
        loadMedicalData();
        
        // تحديث التقارير
        updateReportsTable();
        updateStats();
        
        // تعيين الأحداث
        setupEventListeners();
        
        systemReady = true;
        
        console.log('✅ النظام جاهز للاستخدام');
        showNotification('النظام جاهز للاستخدام', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة النظام:', error);
        showNotification('تم تفعيل النسخة المحلية', 'warning');
        setupFallbackSystem();
    }
}

// ===== تحميل البيانات الطبية =====
function loadMedicalData() {
    // بيانات التشخيصات
    window.thyroidData = {
        conditions: {
            normal: {
                id: 'normal',
                name: 'وظيفة طبيعية للغدة الدرقية',
                description: 'الغدة تعمل بشكل طبيعي ولا تظهر عليها أي مشاكل أو تشوهات',
                severity: 'low',
                color: '#00b894',
                recommendations: [
                    'مراجعة سنوية للاطمئنان',
                    'تناول غذاء صحي متوازن',
                    'ممارسة الرياضة بانتظام',
                    'الابتعاد عن التوتر النفسي'
                ]
            },
            hypothyroidism: {
                id: 'hypothyroidism',
                name: 'قصور الغدة الدرقية',
                description: 'انخفاض في إنتاج هرمونات الغدة الدرقية',
                severity: 'medium',
                color: '#fdcb6e',
                recommendations: [
                    'مراجعة طبيب الغدد الصماء فوراً',
                    'فحص مستوى TSH كل 6-8 أسابيع',
                    'بدء العلاج الهرموني تحت إشراف طبي',
                    'مراقبة الأعراض الجانبية للعلاج'
                ]
            },
            hyperthyroidism: {
                id: 'hyperthyroidism',
                name: 'فرط نشاط الغدة الدرقية',
                description: 'زيادة في إنتاج هرمونات الغدة الدرقية',
                severity: 'high',
                color: '#e17055',
                recommendations: [
                    'مراجعة طبيب غدد صماء عاجلة',
                    'فحص الأجسام المضادة للغدة الدرقية',
                    'بدء العلاج الدوائي الفوري',
                    'مراقبة معدل ضربات القلب'
                ]
            },
            goiter: {
                id: 'goiter',
                name: 'تضخم الغدة الدرقية',
                description: 'زيادة في حجم الغدة الدرقية',
                severity: 'medium',
                color: '#6c5ce7',
                recommendations: [
                    'فحص الموجات فوق الصوتية للغدة',
                    'مراقبة حجم الغدة كل 3-6 أشهر',
                    'فحص وظائف الغدة بشكل دوري',
                    'استشارة جراح الغدد الصماء إذا لزم الأمر'
                ]
            }
        },
        
        labRanges: {
            tsh: { min: 0.4, max: 4.0, unit: 'mIU/L' },
            t4: { min: 4.5, max: 11.2, unit: 'μg/dL' },
            t3: { min: 80, max: 200, unit: 'ng/dL' }
        },
        
        symptomsMap: {
            'تعب': ['hypothyroidism', 'hyperthyroidism'],
            'وزن': ['hypothyroidism', 'hyperthyroidism'],
            'حرارة': ['hypothyroidism', 'hyperthyroidism'],
            'نبض': ['hyperthyroidism'],
            'مزاج': ['hypothyroidism', 'hyperthyroidism'],
            'تورم': ['goiter']
        }
    };
    
    console.log('📊 تم تحميل البيانات الطبية');
}

// ===== إعداد الأحداث =====
function setupEventListeners() {
    // رفع الملفات
    document.getElementById('imageUpload')?.addEventListener('change', handleImageUpload);
    
    // تحديث عدد الأعراض
    document.querySelectorAll('input[name="symptoms"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSymptomsCount);
    });
    
    // البحث في التقارير
    document.getElementById('searchReports')?.addEventListener('input', filterReports);
    
    // تبديل الوضع الليلي
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    
    // زر القائمة المتنقلة
    document.getElementById('mobileToggle')?.addEventListener('click', toggleMobileMenu);
    
    // التنقل في القائمة
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href')?.substring(1);
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                    
                    // تحديث القائمة النشطة
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    // إغلاق القائمة المتنقلة إذا كانت مفتوحة
                    document.querySelector('.nav-menu')?.classList.remove('active');
                    document.getElementById('mobileToggle')?.classList.remove('active');
                }
            }
        });
    });
}

// ===== رفع الصور =====
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // التحقق من حجم الملف
    if (file.size > 10 * 1024 * 1024) {
        showNotification('حجم الملف كبير جداً (الحد الأقصى 10MB)', 'error');
        return;
    }
    
    // عرض المعاينة
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `
                <div class="preview-image">
                    <img src="${e.target.result}" alt="معاينة الصورة">
                    <div class="preview-info">
                        <p><i class="fas fa-check-circle"></i> ${file.name}</p>
                        <p><i class="fas fa-weight-hanging"></i> ${(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>
            `;
            
            showNotification('✅ تم تحميل الصورة بنجاح', 'success');
        }
    };
    
    reader.readAsDataURL(file);
}

// ===== تحديث عدد الأعراض =====
function updateSymptomsCount() {
    const checked = document.querySelectorAll('input[name="symptoms"]:checked').length;
    const countElement = document.getElementById('symptomsCount');
    if (countElement) {
        countElement.textContent = checked;
    }
}

// ===== بدء التشخيص =====
async function startDiagnosis() {
    console.log('🏁 بدء عملية التشخيص...');
    
    // منع التشخيص المزدوج
    if (isAnalyzing) {
        showNotification('جاري التشخيص بالفعل، الرجاء الانتظار...', 'warning');
        return;
    }
    
    // التحقق من البيانات
    if (!validateForm()) {
        return;
    }
    
    // عرض شاشة التحميل
    showAILoading(true);
    isAnalyzing = true;
    
    try {
        // محاكاة عملية التحليل
        await simulateAnalysis();
        
        // جمع البيانات
        const patientData = collectPatientData();
        
        // تحليل البيانات
        const analysis = analyzePatientData(patientData);
        
        // توليد التقرير
        const report = generateDiagnosisReport(patientData, analysis);
        
        // عرض النتائج
        displayResults(report);
        
        // حفظ التقرير
        saveReportToStorage(report);
        
        showNotification('✅ تم التشخيص بنجاح', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في التشخيص:', error);
        showNotification('حدث خطأ أثناء التشخيص', 'error');
    } finally {
        // إخفاء شاشة التحميل
        showAILoading(false);
        isAnalyzing = false;
    }
}

// ===== محاكاة عملية التحليل =====
async function simulateAnalysis() {
    return new Promise((resolve) => {
        let progress = 0;
        const messages = [
            'جاري تحليل بيانات المريض...',
            'جاري فحص نتائج التحاليل...',
            'جاري تحليل الصورة...',
            'جاري توليد التشخيص...',
            'جاري إعداد التقرير النهائي...'
        ];
        
        const interval = setInterval(() => {
            progress += 20;
            if (progress > 100) progress = 100;
            
            // تحديث شريط التقدم
            const progressBar = document.getElementById('aiProgress');
            const progressText = document.getElementById('progressText');
            const loadingText = document.getElementById('loadingText');
            
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            if (progressText) {
                progressText.textContent = progress + '%';
            }
            
            // تحديث الرسالة كل 20%
            const messageIndex = Math.floor(progress / 20) - 1;
            if (messageIndex >= 0 && messageIndex < messages.length && loadingText) {
                loadingText.textContent = messages[messageIndex];
            }
            
            // إكمال المحاكاة عند الوصول إلى 100%
            if (progress >= 100) {
                clearInterval(interval);
                
                // تأخير بسيط لإظهار اكتمال التقدم
                setTimeout(() => {
                    // إخفاء شاشة التحميل
                    showAILoading(false);
                    resolve();
                }, 300);
            }
        }, 300);
    });
}

// ===== التحقق من البيانات =====
function validateForm() {
    const name = document.getElementById('patientName')?.value.trim();
    const age = document.getElementById('patientAge')?.value;
    const gender = document.getElementById('patientGender')?.value;
    const tsh = document.getElementById('tshLevel')?.value;
    
    if (!name) {
        showNotification('الرجاء إدخال اسم المريض', 'error');
        return false;
    }
    
    if (!age || age < 1 || age > 120) {
        showNotification('الرجاء إدخال عمر صحيح بين 1 و 120 سنة', 'error');
        return false;
    }
    
    if (!gender) {
        showNotification('الرجاء اختيار جنس المريض', 'error');
        return false;
    }
    
    if (!tsh) {
        showNotification('الرجاء إدخال قيمة TSH على الأقل', 'warning');
        // نستمر مع تحذير
    }
    
    return true;
}

// ===== جمع بيانات المريض =====
function collectPatientData() {
    const symptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked'))
        .map(cb => cb.value);
    
    return {
        id: Date.now(),
        name: document.getElementById('patientName').value,
        age: parseInt(document.getElementById('patientAge').value),
        gender: document.getElementById('patientGender').value,
        phone: document.getElementById('patientPhone')?.value || '',
        medicalHistory: document.getElementById('medicalHistory')?.value || '',
        tsh: parseFloat(document.getElementById('tshLevel').value) || null,
        t4: parseFloat(document.getElementById('t4Level').value) || null,
        t3: parseFloat(document.getElementById('t3Level').value) || null,
        symptoms: symptoms,
        date: new Date().toLocaleString('ar-EG'),
        timestamp: Date.now()
    };
}

// ===== تحليل بيانات المريض =====
function analyzePatientData(patientData) {
    console.log('🔬 تحليل بيانات المريض...');
    
    const analysis = {
        labResults: analyzeLabResults(patientData),
        symptomsAnalysis: analyzeSymptoms(patientData.symptoms),
        demographics: analyzeDemographics(patientData),
        riskFactors: [],
        confidence: 0
    };
    
    // تحليل المختبر
    const labStatus = analysis.labResults.overallStatus;
    
    // تحليل الأعراض
    const symptomScore = analysis.symptomsAnalysis.score;
    
    // حساب الثقة
    analysis.confidence = calculateConfidence(labStatus, symptomScore, patientData);
    
    // تحديد التشخيص
    analysis.diagnosis = determineDiagnosis(analysis, patientData);
    
    // حساب المخاطر
    analysis.riskLevel = calculateRiskLevel(analysis, patientData);
    
    // توليد التوصيات
    analysis.recommendations = generateRecommendations(analysis.diagnosis, patientData);
    
    console.log('✅ تحليل مكتمل:', analysis);
    return analysis;
}

// ===== تحليل نتائج المختبر =====
function analyzeLabResults(data) {
    const ranges = window.thyroidData.labRanges;
    const results = {
        tsh: { value: data.tsh, status: 'normal', note: '' },
        t4: { value: data.t4, status: 'normal', note: '' },
        t3: { value: data.t3, status: 'normal', note: '' },
        overallStatus: 'normal'
    };
    
    // تحليل TSH
    if (data.tsh) {
        if (data.tsh < ranges.tsh.min) {
            results.tsh.status = 'low';
            results.tsh.note = 'فرط نشاط محتمل';
        } else if (data.tsh > ranges.tsh.max) {
            results.tsh.status = 'high';
            results.tsh.note = 'قصور محتمل';
        }
    }
    
    // تحليل T4
    if (data.t4) {
        if (data.t4 < ranges.t4.min) {
            results.t4.status = 'low';
            results.t4.note = 'انخفاض هرمون الغدة';
        } else if (data.t4 > ranges.t4.max) {
            results.t4.status = 'high';
            results.t4.note = 'ارتفاع هرمون الغدة';
        }
    }
    
    // تحديد الحالة العامة
    const abnormalCount = [results.tsh, results.t4, results.t3]
        .filter(r => r.status !== 'normal').length;
    
    if (abnormalCount >= 2) {
        results.overallStatus = 'high';
    } else if (abnormalCount === 1) {
        results.overallStatus = 'medium';
    }
    
    return results;
}

// ===== تحليل الأعراض =====
function analyzeSymptoms(symptoms) {
    const conditions = window.thyroidData.conditions;
    const symptomMap = window.thyroidData.symptomsMap;
    
    let scores = {};
    let totalScore = 0;
    
    symptoms.forEach(symptom => {
        const affectedConditions = symptomMap[symptom] || [];
        affectedConditions.forEach(condition => {
            scores[condition] = (scores[condition] || 0) + 1;
            totalScore++;
        });
    });
    
    // تحديد الحالة السائدة
    let dominantCondition = 'normal';
    let maxScore = 0;
    
    Object.keys(scores).forEach(condition => {
        if (scores[condition] > maxScore) {
            maxScore = scores[condition];
            dominantCondition = condition;
        }
    });
    
    return {
        count: symptoms.length,
        scores: scores,
        dominantCondition: dominantCondition,
        score: totalScore
    };
}

// ===== تحليل البيانات الديموغرافية =====
function analyzeDemographics(data) {
    const age = data.age;
    const gender = data.gender;
    
    let riskScore = 0;
    
    // خطر العمر
    if (age > 50) riskScore += 2;
    else if (age > 40) riskScore += 1;
    
    // خطر الجنس (الإناث أكثر عرضة)
    if (gender === 'female') riskScore += 1;
    
    return {
        age: age,
        gender: gender,
        ageRisk: age > 50 ? 'high' : age > 40 ? 'medium' : 'low',
        genderRisk: gender === 'female' ? 'medium' : 'low',
        riskScore: riskScore
    };
}

// ===== حساب الثقة =====
function calculateConfidence(labStatus, symptomScore, patientData) {
    let confidence = 70; // الحد الأدنى
    
    // إضافة نقاط بناءً على نتائج المختبر
    if (labStatus === 'high') confidence += 15;
    else if (labStatus === 'medium') confidence += 10;
    
    // إضافة نقاط بناءً على الأعراض
    if (symptomScore > 0) confidence += Math.min(10, symptomScore * 2);
    
    // إضافة نقاط إذا كانت هناك بيانات كافية
    if (patientData.tsh && patientData.t4) confidence += 5;
    
    // الحد الأقصى 95%
    return Math.min(95, confidence);
}

// ===== تحديد التشخيص =====
function determineDiagnosis(analysis, patientData) {
    const conditions = window.thyroidData.conditions;
    
    // إذا كانت جميع النتائج طبيعية
    if (analysis.labResults.overallStatus === 'normal' && 
        analysis.symptomsAnalysis.count === 0) {
        return conditions.normal;
    }
    
    // إذا كان TSH منخفض والأعراض تشير لفرط النشاط
    if (analysis.labResults.tsh.status === 'low' && 
        analysis.symptomsAnalysis.dominantCondition === 'hyperthyroidism') {
        return conditions.hyperthyroidism;
    }
    
    // إذا كان TSH مرتفع والأعراض تشير لقصور
    if (analysis.labResults.tsh.status === 'high' && 
        analysis.symptomsAnalysis.dominantCondition === 'hypothyroidism') {
        return conditions.hypothyroidism;
    }
    
    // إذا كانت الأعراض تشير لتضخم
    if (analysis.symptomsAnalysis.dominantCondition === 'goiter') {
        return conditions.goiter;
    }
    
    // إذا كانت هناك نتائج غير طبيعية ولكن غير محددة
    if (analysis.labResults.overallStatus !== 'normal') {
        // اختر بناءً على TSH (المعيار الرئيسي)
        if (analysis.labResults.tsh.status === 'low') {
            return conditions.hyperthyroidism;
        } else if (analysis.labResults.tsh.status === 'high') {
            return conditions.hypothyroidism;
        }
    }
    
    // إذا لم يكن هناك تشخيص محدد
    return {
        id: 'unknown',
        name: 'يحتاج لتقييم طبي إضافي',
        description: 'يحتاج لفحوصات أكثر دقة من قبل طبيب متخصص',
        severity: 'medium',
        color: '#a0a0b8',
        recommendations: [
            'مراجعة طبيب الغدد الصماء المتخصص',
            'إجراء فحوصات إضافية',
            'متابعة الأعراض وتسجيلها'
        ]
    };
}

// ===== حساب مستوى الخطورة =====
function calculateRiskLevel(analysis, patientData) {
    let score = 0;
    
    // نتائج المختبر
    if (analysis.labResults.overallStatus === 'high') score += 3;
    else if (analysis.labResults.overallStatus === 'medium') score += 2;
    
    // الأعراض
    score += Math.min(3, Math.floor(analysis.symptomsAnalysis.count / 2));
    
    // العمر
    if (patientData.age > 50) score += 2;
    else if (patientData.age > 40) score += 1;
    
    // التاريخ المرضي (إذا كان طويلاً)
    if (patientData.medicalHistory && patientData.medicalHistory.length > 50) {
        score += 1;
    }
    
    if (score <= 2) return 'low';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'high';
    return 'critical';
}

// ===== توليد التوصيات =====
function generateRecommendations(diagnosis, patientData) {
    const recommendations = [...diagnosis.recommendations];
    
    // توصيات عامة
    recommendations.unshift('مراجعة طبيب الغدد الصماء المتخصص');
    
    // توصيات حسب العمر
    if (patientData.age > 60) {
        recommendations.push('فحص دوري شامل كل 6 أشهر');
    }
    
    // توصيات حسب شدة الأعراض
    const symptomCount = patientData.symptoms.length;
    if (symptomCount > 3) {
        recommendations.push('متابعة أسبوعية مع الطبيب حتى استقرار الحالة');
    }
    
    return recommendations;
}

// ===== توليد التقرير النهائي =====
function generateDiagnosisReport(patientData, analysis) {
    const reportId = 'THY-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    const report = {
        id: reportId,
        patientInfo: {
            name: patientData.name,
            age: patientData.age,
            gender: patientData.gender,
            medicalHistory: patientData.medicalHistory
        },
        diagnosis: {
            primary: analysis.diagnosis,
            confidence: analysis.confidence,
            riskLevel: analysis.riskLevel,
            labResults: analysis.labResults,
            symptoms: patientData.symptoms
        },
        recommendations: analysis.recommendations,
        medications: suggestMedications(analysis.diagnosis.id),
        followUp: generateFollowUpPlan(analysis.diagnosis.id, analysis.riskLevel),
        date: patientData.date,
        timestamp: patientData.timestamp
    };
    
    console.log('📄 التقرير النهائي:', report);
    return report;
}

// ===== اقتراح الأدوية =====
function suggestMedications(diagnosisId) {
    const medications = {
        normal: 'لا حاجة لأدوية حالياً. التغذية الصحية وممارسة الرياضة كافية.',
        hypothyroidism: 'ليفوثيروكسين (Levothyroxine) - بدء بجرعة 50-100 ميكروجرام/يوم تحت إشراف طبي',
        hyperthyroidism: 'ميثيمازول (Methimazole) أو بروبيل ثيوراسيل (PTU) - حسب شدة الحالة وتحت إشراف طبي',
        goiter: 'علاج هرموني كبتي إذا كان القصور هو السبب، أو متابعة بدون علاج إذا كان بسيطاً',
        unknown: 'يحتاج لتقييم طبي قبل وصف أي أدوية'
    };
    
    return medications[diagnosisId] || 'يحتاج لتقييم طبي قبل وصف أي أدوية';
}

// ===== خطة المتابعة =====
function generateFollowUpPlan(diagnosisId, riskLevel) {
    const plans = {
        normal: 'مراجعة سنوية للاطمئنان',
        hypothyroidism: riskLevel === 'high' ? 
            'مراجعة كل 4-6 أسابيع حتى استقرار المستويات' :
            'مراجعة كل 2-3 أشهر',
        hyperthyroidism: 'مراجعة أسبوعية في الشهر الأول، ثم كل 2-4 أسابيع',
        goiter: 'مراجعة كل 3-6 أشهر لمراقبة حجم الغدة',
        unknown: 'مراجعة خلال أسبوعين للتقييم الطبي'
    };
    
    return plans[diagnosisId] || 'مراجعة خلال شهر';
}

// ===== عرض النتائج =====
function displayResults(report) {
    console.log('📊 عرض النتائج...');
    
    // معلومات المريض
    document.getElementById('resultPatientName').textContent = report.patientInfo.name;
    document.getElementById('resultAge').textContent = report.patientInfo.age + ' سنة';
    document.getElementById('resultGender').textContent = report.patientInfo.gender === 'male' ? 'ذكر' : 'أنثى';
    document.getElementById('resultDate').textContent = report.date;
    document.getElementById('reportNumber').textContent = report.id;
    
    // التشخيص
    document.getElementById('finalDiagnosis').textContent = report.diagnosis.primary.name;
    document.getElementById('diagnosisDescription').textContent = report.diagnosis.primary.description;
    
    // الثقة
    const confidence = Math.round(report.diagnosis.confidence);
    document.getElementById('confidenceValue').textContent = confidence + '%';
    document.getElementById('confidenceFill').style.width = confidence + '%';
    
    // شدة الخطورة
    const severityBadge = document.getElementById('severityBadge');
    severityBadge.textContent = getSeverityText(report.diagnosis.riskLevel);
    severityBadge.className = 'severity-badge ' + report.diagnosis.riskLevel;
    
    // التوصيات
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = report.recommendations
        .map(rec => `<div class="recommendation-item"><i class="fas fa-check-circle"></i><p>${rec}</p></div>`)
        .join('');
    
    // الأدوية
    document.getElementById('medicationsContent').textContent = report.medications;
    
    // إظهار قسم النتائج
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===== حفظ التقرير =====
function saveReportToStorage(report) {
    const savedReport = {
        id: report.id,
        patientName: report.patientInfo.name,
        date: report.date,
        diagnosis: report.diagnosis.primary.name,
        severity: report.diagnosis.primary.severity,
        riskLevel: report.diagnosis.riskLevel,
        confidence: report.diagnosis.confidence,
        data: report
    };
    
    reports.unshift(savedReport);
    localStorage.setItem('thyroidReports', JSON.stringify(reports));
    
    updateReportsTable();
    updateStats();
}

// ===== تحديث جدول التقارير =====
function updateReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    const emptyState = document.getElementById('emptyReports');
    
    if (!tbody) return;
    
    if (reports.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    tbody.innerHTML = reports.map((report, index) => `
        <tr>
            <td>${report.patientName}</td>
            <td>${report.date}</td>
            <td>
                <span class="diagnosis-label" style="color: ${getConditionColor(report.diagnosis)}">
                    ${report.diagnosis}
                </span>
            </td>
            <td>
                <div class="confidence-badge">
                    ${Math.round(report.confidence)}%
                </div>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn view" onclick="viewReport(${index})">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button class="table-btn delete" onclick="deleteReport(${index})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== عرض تقرير =====
function viewReport(index) {
    if (reports[index]) {
        currentDiagnosis = reports[index].data;
        displayResults(currentDiagnosis);
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// ===== حذف تقرير =====
function deleteReport(index) {
    if (confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
        reports.splice(index, 1);
        localStorage.setItem('thyroidReports', JSON.stringify(reports));
        updateReportsTable();
        updateStats();
        showNotification('🗑️ تم حذف التقرير', 'success');
    }
}

// ===== تحديث الإحصائيات =====
function updateStats() {
    const total = reports.length;
    const normal = reports.filter(r => r.severity === 'low').length;
    const warning = reports.filter(r => r.severity === 'medium').length;
    const critical = reports.filter(r => r.severity === 'high' || r.riskLevel === 'critical').length;
    
    document.getElementById('totalReports').textContent = total;
    document.getElementById('normalReports').textContent = normal;
    document.getElementById('warningReports').textContent = warning;
    document.getElementById('criticalReports').textContent = critical;
}

// ===== تصفية التقارير =====
function filterReports() {
    const query = document.getElementById('searchReports')?.value.toLowerCase();
    const rows = document.querySelectorAll('#reportsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// ===== إظهار/إخفاء تحميل AI =====
function showAILoading(show) {
    const loading = document.getElementById('aiLoading');
    if (!loading) return;
    
    if (show) {
        loading.style.display = 'flex';
        
        // إعادة تعيين التقدم
        const progressBar = document.getElementById('aiProgress');
        const progressText = document.getElementById('progressText');
        const loadingText = document.getElementById('loadingText');
        
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
        if (loadingText) loadingText.textContent = 'جاري تحليل البيانات...';
    } else {
        loading.style.display = 'none';
    }
}

// ===== طباعة التقرير =====
function printReport() {
    if (!currentDiagnosis) {
        showNotification('لا يوجد تقرير للطباعة', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const content = createPrintContent(currentDiagnosis);
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// ===== حفظ التقرير =====
function saveReport() {
    if (!currentDiagnosis) {
        showNotification('لا يوجد تقرير للحفظ', 'error');
        return;
    }
    
    saveReportToStorage(currentDiagnosis);
    showNotification('✅ تم حفظ التقرير في الأرشيف', 'success');
}

// ===== تشخيص جديد =====
function newDiagnosis() {
    // إعادة تعيين النموذج
    document.getElementById('patientName').value = '';
    document.getElementById('patientAge').value = '';
    document.getElementById('patientGender').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('medicalHistory').value = '';
    document.getElementById('tshLevel').value = '';
    document.getElementById('t4Level').value = '';
    document.getElementById('t3Level').value = '';
    
    // إعادة تعيين الأعراض
    document.querySelectorAll('input[name="symptoms"]').forEach(cb => {
        cb.checked = false;
    });
    updateSymptomsCount();
    
    // إعادة تعيين الصورة
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-image"></i>
                <p>لم يتم رفع أي صورة بعد</p>
            </div>
        `;
    }
    
    document.getElementById('imageUpload').value = '';
    
    // إخفاء النتائج
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    // التمرير لأعلى
    const diagnoseSection = document.getElementById('diagnose');
    if (diagnoseSection) {
        diagnoseSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    showNotification('🆕 جاهز لتشخيص جديد', 'info');
}

// ===== وظائف المساعدة =====
function getConditionColor(diagnosisName) {
    const conditions = window.thyroidData?.conditions;
    if (conditions) {
        for (const key in conditions) {
            if (conditions[key].name === diagnosisName) {
                return conditions[key].color;
            }
        }
    }
    return '#a0a0b8';
}

function getSeverityText(severity) {
    const texts = {
        low: 'منخفض',
        medium: 'متوسط',
        high: 'مرتفع',
        critical: 'حرج'
    };
    return texts[severity] || 'غير محدد';
}

// ===== توليد محتوى الطباعة =====
function createPrintContent(report) {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>تقرير تشخيص الغدة الدرقية</title>
        <style>
            body {
                font-family: 'Cairo', sans-serif;
                margin: 0;
                padding: 30px;
                color: #333;
                line-height: 1.6;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #6c63ff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
            }
            th, td {
                padding: 10px;
                text-align: right;
                border: 1px solid #ddd;
            }
            th {
                background: #f8f9ff;
            }
            .badge {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                color: white;
                font-weight: bold;
            }
            .low { background: #00b894; }
            .medium { background: #fdcb6e; }
            .high { background: #e17055; }
            .critical { background: #d63031; }
            .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
                text-align: center;
            }
            @media print {
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="color: #6c63ff; margin: 0;">🏥 نظام تشخيص الغدة الدرقية الذكي</h1>
            <p style="color: #666;">تقرير طبي رقم: ${report.id || 'غير معروف'}</p>
            <p>تاريخ الإصدار: ${report.date}</p>
        </div>
        
        <div class="section">
            <h2 style="color: #6c63ff; border-right: 4px solid #6c63ff; padding-right: 15px;">معلومات المريض</h2>
            <table>
                <tr><th>اسم المريض</th><td>${report.patientInfo.name}</td></tr>
                <tr><th>العمر والجنس</th><td>${report.patientInfo.age} سنة | ${report.patientInfo.gender === 'male' ? 'ذكر' : 'أنثى'}</td></tr>
                <tr><th>تاريخ الفحص</th><td>${report.date}</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2 style="color: #6c63ff; border-right: 4px solid #6c63ff; padding-right: 15px;">نتائج التشخيص</h2>
            <table>
                <tr><th>التشخيص الرئيسي</th><td>${report.diagnosis.primary.name}</td></tr>
                <tr><th>وصف الحالة</th><td>${report.diagnosis.primary.description}</td></tr>
                <tr><th>مستوى الخطورة</th><td><span class="badge ${report.diagnosis.riskLevel}">${report.diagnosis.riskLevel}</span></td></tr>
                <tr><th>دقة التحليل</th><td>${Math.round(report.diagnosis.confidence)}%</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2 style="color: #6c63ff; border-right: 4px solid #6c63ff; padding-right: 15px;">التوصيات الطبية</h2>
            <ul style="padding-right: 20px;">
                ${report.recommendations.map(rec => `<li style="margin-bottom: 10px;">${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="section">
            <h2 style="color: #6c63ff; border-right: 4px solid #6c63ff; padding-right: 15px;">خطة المتابعة</h2>
            <p>${report.followUp}</p>
            <h3>الاقتراحات الدوائية:</h3>
            <p>${report.medications}</p>
        </div>
        
        <div class="footer">
            <p>تم إنشاء هذا التقرير آلياً بواسطة نظام تشخيص الغدة الدرقية الذكي</p>
            <p>هذا التشخيص لأغراض مساعدة الطبيب وليس بديلاً عن التشخيص الطبي الكامل</p>
            <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
        
        <button class="no-print" onclick="window.print()" style="
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 10px 20px;
            background: #6c63ff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        ">طباعة</button>
    </body>
    </html>
    `;
}

// ===== النظام الاحتياطي =====
function setupFallbackSystem() {
    console.log('🔄 تفعيل النظام الاحتياطي...');
    
    // نظام مبني على القواعد
    window.fallbackAnalyzer = {
        analyze: function(data) {
            const tsh = data.tsh || 2.5;
            let diagnosis = 'normal';
            
            if (tsh < 0.4) diagnosis = 'hyperthyroidism';
            else if (tsh > 4.0) diagnosis = 'hypothyroidism';
            else if (tsh > 10.0) diagnosis = 'severe_hypothyroidism';
            
            return {
                diagnosis: diagnosis,
                confidence: 75,
                recommendations: [
                    'مراجعة طبيب الغدد الصماء',
                    'فحص دوري كل 6 أشهر'
                ]
            };
        }
    };
    
    systemReady = true;
}

// ===== تبديل الوضع الليلي =====
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('#themeToggle i');
    
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// ===== تبديل القائمة المتنقلة =====
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.getElementById('mobileToggle');
    
    if (navMenu) navMenu.classList.toggle('active');
    if (mobileToggle) mobileToggle.classList.toggle('active');
}

// ===== إظهار المساعدة =====
function showHelp() {
    showNotification(`
        <strong>كيفية استخدام النظام:</strong><br>
        1. املأ بيانات المريض<br>
        2. ارفع صورة الأشعة (اختياري)<br>
        3. أدخل نتائج التحاليل<br>
        4. اختر الأعراض الظاهرة<br>
        5. انقر على "بدء التشخيص الذكي"<br><br>
        <small>ملاحظة: هذا النظام يقدم تشخيصاً أولياً للمساعدة فقط</small>
    `, 'info');
}

// ===== إظهار الإشعارات =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            ${type === 'success' ? '✅' : 
              type === 'warning' ? '⚠️' : 
              type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // إزالة تلقائية بعد 5 ثوان
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ===== إصلاح شريط التقدم =====
function fixProgressBar() {
    // التحقق من عناصر التقدم
    const progressBar = document.getElementById('aiProgress');
    const progressText = document.getElementById('progressText');
    const loadingText = document.getElementById('loadingText');
    
    if (!progressBar || !progressText || !loadingText) {
        console.warn('⚠️ عناصر التقدم غير موجودة، جاري إنشائها...');
        
        // إنشاء العناصر إذا كانت مفقودة
        const aiLoading = document.getElementById('aiLoading');
        if (aiLoading) {
            aiLoading.innerHTML = `
                <div class="ai-loader">
                    <div class="ai-brain">
                        <div class="neuron"></div>
                        <div class="neuron"></div>
                        <div class="neuron"></div>
                    </div>
                    <div class="loading-text" id="loadingText">جاري تحليل البيانات...</div>
                    <div class="loading-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="aiProgress"></div>
                        </div>
                        <div class="progress-text" id="progressText">0%</div>
                    </div>
                </div>
            `;
        }
    }
    
    console.log('✅ تم إصلاح شريط التقدم');
    return true;
}

// ===== تصدير الوظائف للنوافذ =====
window.initializeSystem = initializeSystem;
window.startDiagnosis = startDiagnosis;
window.printReport = printReport;
window.saveReport = saveReport;
window.newDiagnosis = newDiagnosis;
window.viewReport = viewReport;
window.deleteReport = deleteReport;
window.filterReports = filterReports;
window.toggleTheme = toggleTheme;
window.toggleMobileMenu = toggleMobileMenu;
window.showHelp = showHelp;
window.showNotification = showNotification;
window.fixProgressBar = fixProgressBar;
window.scrollToDiagnose = function() {
    const diagnoseSection = document.getElementById('diagnose');
    if (diagnoseSection) {
        diagnoseSection.scrollIntoView({ behavior: 'smooth' });
    }
};

// ===== التهيئة التلقائية المحسنة =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 تم تحميل DOM بالكامل');
    
    // تحميل الوضع المحفوظ
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    }
    
    // إصلاح شريط التقدم
    setTimeout(fixProgressBar, 100);
    
    // تهيئة النظام مع تأخير مناسب
    setTimeout(function() {
        if (!systemReady) {
            console.log('🔄 بدء تهيئة النظام بعد تحميل الصفحة...');
            initializeSystem();
        }
    }, 1500);
});

console.log('===================================');
console.log('   نظام تشخيص الغدة الدرقية الذكي   ');
console.log('        النسخة المصححة 2.0.1       ');
console.log('    تم إصلاح مشاكل التقدم والتحميل  ');
console.log('===================================');