import re
import shlex
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PyQt6 import QtCore, QtWidgets
    QT_ALIGN_TOP = QtCore.Qt.AlignmentFlag.AlignTop
    def qt_exec(app):
        return app.exec()
except ImportError:
    from PyQt5 import QtCore, QtWidgets
    QT_ALIGN_TOP = QtCore.Qt.AlignTop
    def qt_exec(app):
        return app.exec_()

# Voice list obtained from `edge-tts --list-voices`
# This is hardcoded to avoid running the command every time the app starts.
SWEDISH_VOICES = [
    "sv-SE-HilleviNeural",
    "sv-SE-MattiasNeural",
    "sv-SE-SofieNeural",
]


VOICE_LIST_RAW = '''
Name                                  Gender    ContentCategorie
s    VoicePersonalities
------------------------------------  --------  ----------------
---  ------------------------------------------------
af-ZA-AdriNeural                      Female
     Well-Rounded, Animated, Bright
af-ZA-WillemNeural                    Male
am-ET-AmehaNeural                     Male
am-ET-MekdesNeural                    Female
ar-AE-FatimaNeural                    Female
     Crisp, Bright, Clear
ar-AE-HamdanNeural                    Male
ar-BH-AliNeural                       Male
ar-BH-LailaNeural                     Female
ar-DZ-AminaNeural                     Female
     Crisp, Bright, Clear
ar-DZ-IsmaelNeural                    Male
ar-EG-SalmaNeural                     Female
     Crisp, Bright, Clear
ar-EG-ShakirNeural                    Male
ar-IQ-BasselNeural                    Male
ar-IQ-RanaNeural                      Female
ar-JO-SanaNeural                      Female
ar-JO-TaimNeural                      Male
ar-KW-FahedNeural                     Male
ar-KW-NouraNeural                     Female
     Crisp, Bright, Clear
ar-LB-LaylaNeural                     Female
ar-LB-RamiNeural                      Male
ar-LY-ImanNeural                      Female
ar-LY-OmarNeural                      Male
ar-MA-JamalNeural                     Male
ar-MA-MounaNeural                     Female
     Crisp, Bright, Clear
ar-OM-AbdullahNeural                  Male
ar-OM-AyshaNeural                     Female
     Sincere, Pleasant
ar-QA-AmalNeural                      Female
ar-QA-MoazNeural                      Male
ar-SA-HamedNeural                     Male
ar-SA-ZariyahNeural                   Female
     Crisp, Bright, Clear
ar-SY-AmanyNeural                     Female
     Sincere, Pleasant
ar-SY-LaithNeural                     Male
ar-TN-HediNeural                      Male
ar-TN-ReemNeural                      Female
     Sincere, Pleasant
ar-YE-MaryamNeural                    Female
ar-YE-SalehNeural                     Male
as-IN-PriyomNeural                    Male
as-IN-YashicaNeural                   Female
az-AZ-BabekNeural                     Male
az-AZ-BanuNeural                      Female
bg-BG-BorislavNeural                  Male
     Light-Hearted, Whimsical, Friendly
bg-BG-KalinaNeural                    Female
bn-BD-NabanitaNeural                  Female
bn-BD-PradeepNeural                   Male
bn-IN-BashkarNeural                   Male
bn-IN-TanishaaNeural                  Female
bs-BA-GoranNeural                     Male
bs-BA-VesnaNeural                     Female
ca-ES-AlbaNeural                      Female
     Crisp, Bright, Clear
ca-ES-EnricNeural                     Male
ca-ES-JoanaNeural                     Female
cs-CZ-AntoninNeural                   Male
cs-CZ-VlastaNeural                    Female
cy-GB-AledNeural                      Male
cy-GB-NiaNeural                       Female
da-DK-ChristelNeural                  Female
da-DK-JeppeNeural                     Male
de-AT-IngridNeural                    Female
de-AT-JonasNeural                     Male
     Light-Hearted, Whimsical, Friendly
de-CH-JanNeural                       Male
de-CH-LeniNeural                      Female
de-DE-AmalaNeural                     Female
     Well-Rounded, Animated, Bright
de-DE-BerndNeural                     Male
de-DE-ChristophNeural                 Male
de-DE-ConradNeural                    Male
     Engaging, Friendly
de-DE-ElkeNeural                      Female
de-DE-FlorianMultilingualNeural       Male
     Cheerful, Warm
de-DE-GiselaNeural                    Female
     Crisp, Cheerful, Bright
de-DE-KasperNeural                    Male
de-DE-KatjaNeural                     Female
     Calm, Pleasant
de-DE-KillianNeural                   Male
de-DE-KlarissaNeural                  Female
de-DE-KlausNeural                     Male
de-DE-LouisaNeural                    Female
de-DE-MajaNeural                      Female
de-DE-RalfNeural                      Male
de-DE-SeraphinaMultilingualNeural     Female
     Casual, Casual
de-DE-TanjaNeural                     Female
el-GR-AthinaNeural                    Female
el-GR-NestorasNeural                  Male
en-AU-AnnetteNeural                   Female
en-AU-CarlyNeural                     Female
     Crisp, Cheerful, Bright
en-AU-DarrenNeural                    Male
en-AU-DuncanNeural                    Male
en-AU-ElsieNeural                     Female
en-AU-FreyaNeural                     Female
en-AU-JoanneNeural                    Female
en-AU-KenNeural                       Male
en-AU-KimNeural                       Female
en-AU-NatashaNeural                   Female
     Crisp, Bright, Clear
en-AU-NeilNeural                      Male
en-AU-TimNeural                       Male
en-AU-TinaNeural                      Female
en-AU-WilliamMultilingualNeural       Male
     Warm, Cheerful, Casual, Friendly, Pleasant
en-AU-WilliamNeural                   Male
     Engaging, Strong
en-CA-ClaraNeural                     Female
     Crisp, Bright, Clear
en-CA-LiamNeural                      Male
en-GB-AbbiNeural                      Female
en-GB-AdaMultilingualNeural           Female
     Cheerful, Warm, Gentle, Friendly
en-GB-AlfieNeural                     Male
en-GB-BellaNeural                     Female
en-GB-ElliotNeural                    Male
en-GB-EthanNeural                     Male
en-GB-HollieNeural                    Female
en-GB-LibbyNeural                     Female
     Crisp, Bright, Clear
en-GB-MaisieNeural                    Female
     Crisp, Cheerful, Bright
en-GB-MiaNeural                       Female
en-GB-NoahNeural                      Male
en-GB-OliverNeural                    Male
en-GB-OliviaNeural                    Female
en-GB-OllieMultilingualNeural         Male
     Warm, Cheerful, Casual, Friendly, Pleasant
en-GB-RyanNeural                      Male
     Bright, Engaging
en-GB-SoniaNeural                     Female
     Gentle, Soft
en-GB-ThomasNeural                    Male
en-HK-SamNeural                       Male
en-HK-YanNeural                       Female
en-IE-ConnorNeural                    Male
     Light-Hearted, Whimsical, Friendly
en-IE-EmilyNeural                     Female
en-IN-AaravNeural                     Male
en-IN-AartiIndicNeural                Female
en-IN-AartiNeural                     Female
en-IN-AashiNeural                     Female
en-IN-AnanyaNeural                    Female
en-IN-ArjunIndicNeural                Male
en-IN-ArjunNeural                     Male
en-IN-KavyaNeural                     Female
en-IN-KunalNeural                     Male
en-IN-NeerjaIndicNeural               Female
en-IN-NeerjaNeural                    Female
en-IN-PrabhatIndicNeural              Male
en-IN-PrabhatNeural                   Male
en-IN-RehaanNeural                    Male
en-KE-AsiliaNeural                    Female
en-KE-ChilembaNeural                  Male
en-NG-AbeoNeural                      Male
en-NG-EzinneNeural                    Female
en-NZ-MitchellNeural                  Male
en-NZ-MollyNeural                     Female
en-PH-JamesNeural                     Male
en-PH-RosaNeural                      Female
en-SG-LunaNeural                      Female
en-SG-WayneNeural                     Male
en-TZ-ElimuNeural                     Male
en-TZ-ImaniNeural                     Female
en-US-AIGenerate1Neural               Male
     Serious, Clear, Formal
en-US-AIGenerate2Neural               Female
     Serious, Mature, Formal
en-US-AdamMultilingualNeural          Male
     warm, engaging, deep
en-US-AlloyTurboMultilingualNeural    Male
     Versatile
en-US-AmandaMultilingualNeural        Female
     clear, bright, youthful
en-US-AmberNeural                     Female
     Whimsical, Upbeat, Light-Hearted
en-US-AnaNeural                       Female
     Curious, Cheerful, Engaging
en-US-AndrewMultilingualNeural        Male
     Confident, Casual, Warm
en-US-AndrewNeural                    Male
     Confident, Authentic, Warm
en-US-AriaNeural                      Female
     Crisp, Bright, Clear
en-US-AshTurboMultilingualNeural      Male
en-US-AshleyNeural                    Female
     Sincere, Approachable, Honest
en-US-AvaMultilingualNeural           Female
     Pleasant, Friendly, Caring
en-US-AvaNeural                       Female
     Pleasant, Caring, Friendly
en-US-BlueNeural                      Neutral
     Formal, Serious, Confident
en-US-BrandonMultilingualNeural       Male
     Warm, Engaging, Authentic
en-US-BrandonNeural                   Male
     Warm, Engaging, Authentic
en-US-BrianMultilingualNeural         Male
     Sincere, Calm, Approachable
en-US-BrianNeural                     Male
     Sincere, Calm, Approachable
en-US-ChristopherMultilingualNeural   Male
     Deep, Warm
en-US-ChristopherNeural               Male
     Deep, Warm
en-US-CoraMultilingualNeural          Female
     Empathetic, Formal, Sincere
en-US-CoraNeural                      Female
     Empathetic, Formal, Sincere
en-US-DavisMultilingualNeural         Male
     soothing, calm, smooth
en-US-DavisNeural                     Male
     Soothing, Calm, Smooth
en-US-DerekMultilingualNeural         Male
     confident, knowledgable, formal
en-US-DustinMultilingualNeural        Male
     youthful, clear, thoughtful
en-US-EchoTurboMultilingualNeural     Male
en-US-ElizabethNeural                 Female
     Authoritative, Formal, Serious
en-US-EmmaMultilingualNeural          Female
     Cheerful, Light-Hearted, Casual
en-US-EmmaNeural                      Female
     Cheerful, Light-Hearted, Casual
en-US-EricNeural                      Male
     Confident, Sincere, Warm
en-US-EvelynMultilingualNeural        Female
     Youthful, Crisp, Upbeat
en-US-FableTurboMultilingualNeural    Neutral
en-US-GuyNeural                       Male
     Light-Hearted, Whimsical, Friendly
en-US-JacobNeural                     Male
     Sincere, Formal, Confident
en-US-JaneNeural                      Female
     Serious, Approachable, Upbeat
en-US-JasonNeural                     Male
     Gentle, Shy, Polite
en-US-JennyMultilingualNeural         Female
     Sincere, Pleasant, Approachable
en-US-JennyNeural                     Female
     Sincere, Pleasant, Approachable
en-US-KaiNeural                       Male
     Sincere, Pleasant, Bright, Clear, Friendly, Warm
en-US-LewisMultilingualNeural         Male
     knowledgable, formal, confident
en-US-LolaMultilingualNeural          Female
     sincere, calm, warm
en-US-LunaNeural                      Female
     Sincere, Pleasant, Bright, Clear, Friendly, Warm
en-US-MichelleNeural                  Female
     Confident, Authentic, Warm
en-US-MonicaNeural                    Female
     Mature, Authentic, Warm
en-US-NancyMultilingualNeural         Female
     casual, youthful, approachable
en-US-NancyNeural                     Female
     Confident, Serious, Mature
en-US-NovaTurboMultilingualNeural     Female
     Deep, Resonant
en-US-OnyxTurboMultilingualNeural     Male
en-US-PhoebeMultilingualNeural        Female
     youthful, upbeat, confident
en-US-RogerNeural                     Male
     Serious, Formal, Confident
en-US-RyanMultilingualNeural          Male
     Professional, Authentic, Sincere
en-US-SamuelMultilingualNeural        Male
     sincere, warm, expressive
en-US-SaraNeural                      Female
     Sincere, Calm, Confident
en-US-SerenaMultilingualNeural        Female
     formal, confident, mature
en-US-ShimmerTurboMultilingualNeural  Female
en-US-SteffanMultilingualNeural       Male
     Casual, Thoughtful
en-US-SteffanNeural                   Male
     Mature, Authentic, Warm
en-US-TonyNeural                      Male
     Thoughtful, Authentic, Sincere
en-ZA-LeahNeural                      Female
en-ZA-LukeNeural                      Male
es-AR-ElenaNeural                     Female
     Bright, Clear
es-AR-TomasNeural                     Male
es-BO-MarceloNeural                   Male
es-BO-SofiaNeural                     Female
es-CL-CatalinaNeural                  Female
es-CL-LorenzoNeural                   Male
es-CO-GonzaloNeural                   Male
es-CO-SalomeNeural                    Female
es-CR-JuanNeural                      Male
es-CR-MariaNeural                     Female
es-CU-BelkysNeural                    Female
es-CU-ManuelNeural                    Male
es-DO-EmilioNeural                    Male
es-DO-RamonaNeural                    Female
es-EC-AndreaNeural                    Female
es-EC-LuisNeural                      Male
es-ES-AbrilNeural                     Female
es-ES-AlvaroNeural                    Male
     Confident, Animated
es-ES-ArabellaMultilingualNeural      Female
     Cheerful, Friendly, Casual, Warm, Pleasant
es-ES-ArnauNeural                     Male
es-ES-DarioNeural                     Male
es-ES-EliasNeural                     Male
es-ES-ElviraNeural                    Female
     Bright, Clear
es-ES-EstrellaNeural                  Female
es-ES-IreneNeural                     Female
     Curious, Cheerful
es-ES-IsidoraMultilingualNeural       Female
     Cheerful, Friendly, Warm, Casual
es-ES-LaiaNeural                      Female
es-ES-LiaNeural                       Female
     Animated, Bright
es-ES-NilNeural                       Male
es-ES-SaulNeural                      Male
es-ES-TeoNeural                       Male
es-ES-TrianaNeural                    Female
es-ES-TristanMultilingualNeural       Male
     Formal, Clear, Trusthworthy
es-ES-VeraNeural                      Female
es-ES-XimenaMultilingualNeural        Female
     Formal, Serious, Upbeat
es-ES-XimenaNeural                    Female
     Crisp, Cheerful
es-GQ-JavierNeural                    Male
es-GQ-TeresaNeural                    Female
es-GT-AndresNeural                    Male
es-GT-MartaNeural                     Female
es-HN-CarlosNeural                    Male
es-HN-KarlaNeural                     Female
es-MX-BeatrizNeural                   Female
es-MX-CandelaNeural                   Female
es-MX-CarlotaNeural                   Female
es-MX-CecilioNeural                   Male
es-MX-DaliaMultilingualNeural         Female
     Warm, Cheerful, Casual, Friendly, Pleasant
es-MX-DaliaNeural                     Female
     Bright, Upbeat
es-MX-GerardoNeural                   Male
es-MX-JorgeMultilingualNeural         Male
     Warm, Cheerful, Casual, Friendly, Pleasant
es-MX-JorgeNeural                     Male
     Curious, Deep, Confident
es-MX-LarissaNeural                   Female
es-MX-LibertoNeural                   Male
es-MX-LucianoNeural                   Male
es-MX-MarinaNeural                    Female
     Curious, Cheerful
es-MX-NuriaNeural                     Female
es-MX-PelayoNeural                    Male
es-MX-RenataNeural                    Female
es-MX-YagoNeural                      Male
es-NI-FedericoNeural                  Male
es-NI-YolandaNeural                   Female
es-PA-MargaritaNeural                 Female
es-PA-RobertoNeural                   Male
es-PE-AlexNeural                      Male
es-PE-CamilaNeural                    Female
es-PR-KarinaNeural                    Female
es-PR-VictorNeural                    Male
es-PY-MarioNeural                     Male
es-PY-TaniaNeural                     Female
es-SV-LorenaNeural                    Female
es-SV-RodrigoNeural                   Male
es-US-AlonsoNeural                    Male
es-US-PalomaNeural                    Female
es-UY-MateoNeural                     Male
es-UY-ValentinaNeural                 Female
es-VE-PaolaNeural                     Female
es-VE-SebastianNeural                 Male
et-EE-AnuNeural                       Female
et-EE-KertNeural                      Male
eu-ES-AinhoaNeural                    Female
eu-ES-AnderNeural                     Male
fa-IR-DilaraNeural                    Female
fa-IR-FaridNeural                     Male
fi-FI-HarriNeural                     Male
fi-FI-NooraNeural                     Female
     Bright, Clear
fi-FI-SelmaNeural                     Female
fil-PH-AngeloNeural                   Male
fil-PH-BlessicaNeural                 Female
fr-BE-CharlineNeural                  Female
fr-BE-GerardNeural                    Male
fr-CA-AntoineNeural                   Male
fr-CA-JeanNeural                      Male
fr-CA-SylvieNeural                    Female
fr-CA-ThierryNeural                   Male
     Engaging, Caring
fr-CH-ArianeNeural                    Female
fr-CH-FabriceNeural                   Male
fr-FR-AlainNeural                     Male
fr-FR-BrigitteNeural                  Female
fr-FR-CelesteNeural                   Female
fr-FR-ClaudeNeural                    Male
fr-FR-CoralieNeural                   Female
fr-FR-DeniseNeural                    Female
     Bright, Engaging
fr-FR-EloiseNeural                    Female
     Curious, Cheerful
fr-FR-HenriNeural                     Male
     Strong, Calm
fr-FR-JacquelineNeural                Female
fr-FR-JeromeNeural                    Male
fr-FR-JosephineNeural                 Female
fr-FR-LucienMultilingualNeural        Male
     Warm, Formal, Confident
fr-FR-MauriceNeural                   Male
fr-FR-RemyMultilingualNeural          Male
     Bright, Cheerful
fr-FR-VivienneMultilingualNeural      Female
     Warm, Casual
fr-FR-YvesNeural                      Male
fr-FR-YvetteNeural                    Female
     Animated, Bright
ga-IE-ColmNeural                      Male
ga-IE-OrlaNeural                      Female
gl-ES-RoiNeural                       Male
gl-ES-SabelaNeural                    Female
gu-IN-DhwaniNeural                    Female
gu-IN-NiranjanNeural                  Male
he-IL-AvriNeural                      Male
he-IL-HilaNeural                      Female
hi-IN-AaravNeural                     Male
hi-IN-AartiNeural                     Female
hi-IN-AnanyaNeural                    Female
hi-IN-ArjunNeural                     Male
hi-IN-KavyaNeural                     Female
hi-IN-KunalNeural                     Male
hi-IN-MadhurNeural                    Male
hi-IN-RehaanNeural                    Male
hi-IN-SwaraNeural                     Female
hr-HR-GabrijelaNeural                 Female
hr-HR-SreckoNeural                    Male
     Whimsical, Friendly
hu-HU-NoemiNeural                     Female
hu-HU-TamasNeural                     Male
     Whimsical, Friendly
hy-AM-AnahitNeural                    Female
hy-AM-HaykNeural                      Male
id-ID-ArdiNeural                      Male
id-ID-GadisNeural                     Female
is-IS-GudrunNeural                    Female
is-IS-GunnarNeural                    Male
it-IT-AlessioMultilingualNeural       Male
     Cheerful, Warm, Gentle, Cheerful, Friendly
it-IT-BenignoNeural                   Male
it-IT-CalimeroNeural                  Male
it-IT-CataldoNeural                   Male
it-IT-DiegoNeural                     Male
     Animated, Upbeat
it-IT-ElsaNeural                      Female
     Confident, Crisp
it-IT-FabiolaNeural                   Female
it-IT-FiammaNeural                    Female
it-IT-GianniNeural                    Male
it-IT-GiuseppeMultilingualNeural      Male
     Expressive, Upbeat, Youthful
it-IT-GiuseppeNeural                  Male
     Bright, Warm
it-IT-ImeldaNeural                    Female
it-IT-IrmaNeural                      Female
it-IT-IsabellaMultilingualNeural      Female
     Warm, Cheerful, Casual, Friendly, Pleasant
it-IT-IsabellaNeural                  Female
     Upbeat, Bright
it-IT-LisandroNeural                  Male
it-IT-MarcelloMultilingualNeural      Male
     Cheerful, Friendly, Casual, Warm, Pleasant
it-IT-PalmiraNeural                   Female
     Animated, Bright
it-IT-PierinaNeural                   Female
     Curious, Cheerful
it-IT-RinaldoNeural                   Male
iu-Cans-CA-SiqiniqNeural              Female
iu-Cans-CA-TaqqiqNeural               Male
iu-Latn-CA-SiqiniqNeural              Female
iu-Latn-CA-TaqqiqNeural               Male
ja-JP-AoiNeural                       Female
     Curious, Cheerful
ja-JP-DaichiNeural                    Male
ja-JP-KeitaNeural                     Male
     Casual, Engaging
ja-JP-MasaruMultilingualNeural        Male
     Bright, Warm
ja-JP-MayuNeural                      Female
     Animated, Bright
ja-JP-NanamiNeural                    Female
     Bright, Cheerful
ja-JP-NaokiNeural                     Male
ja-JP-ShioriNeural                    Female
jv-ID-DimasNeural                     Male
jv-ID-SitiNeural                      Female
ka-GE-EkaNeural                       Female
ka-GE-GiorgiNeural                    Male
kz-KZ-AigulNeural                     Female
kz-KZ-DauletNeural                    Male
km-KH-PisethNeural                    Male
km-KH-SreymomNeural                   Female
n-IN-GaganNeural                      Male
n-IN-SapnaNeural                     Female
ko-KR-BongJinNeural                   Male
ko-KR-GookMinNeural                   Male
ko-KR-HyunsuMultilingualNeural        Male
     Formal, Clear, Confident
ko-KR-HyunsuNeural                    Male
     Bright, Casual
ko-KR-InJoonNeural                    Male
     Casual, Friendly
ko-KR-JiMinNeural                     Female
ko-KR-SeoHyeonNeural                  Female
     Curious, Cheerful
ko-KR-SoonBokNeural                   Female
     Animated, Bright
ko-KR-SunHiNeural                     Female
     Confident, Formal
ko-KR-YuJinNeural                     Female
lo-LA-ChanthavongNeural               Male
lo-LA-KeomanyNeural                   Female
lt-LT-LeonasNeural                    Male
lt-LT-OnaNeural                       Female
lv-LV-EveritaNeural                   Female
lv-LV-NilsNeural                      Male
mk-MK-AleksandarNeural                Male
mk-MK-MarijaNeural                    Female
ml-IN-MidhunNeural                    Male
ml-IN-SobhanaNeural                   Female
n-MN-BataaNeural                     Male
n-MN-YesuiNeural                     Female
r-IN-AarohiNeural                    Female
r-IN-ManoharNeural                   Male
s-MY-OsmanNeural                     Male
     Whimsical, Friendly
s-MY-YasminNeural                    Female
t-MT-GraceNeural                     Female
t-MT-JosephNeural                    Male
y-MM-NilarNeural                     Female
y-MM-ThihaNeural                     Male
b-NO-FinnNeural                      Male
b-NO-IselinNeural                    Female
     Bright, Clear
b-NO-PernilleNeural                  Female
e-NP-HemkalaNeural                   Female
e-NP-SagarNeural                     Male
l-BE-ArnaudNeural                    Male
l-BE-DenaNeural                      Female
l-NL-ColetteNeural                   Female
     Bright, Clear
l-NL-FennaNeural                     Female
     Bright, Confident
l-NL-MaartenNeural                   Male
     Formal, Upbeat
r-IN-SubhasiniNeural                 Female
r-IN-SukantNeural                    Male
-IN-OjasNeural                       Male
-IN-VaaniNeural                      Female
-PL-AgnieszkaNeural                 Female
-PL-MarekNeural                     Male
-PL-ZofiaNeural                     Female
     Bright, Clear
s-AF-GulNawazNeural                  Male
s-AF-LatifaNeural                    Female
t-BR-AntonioNeural                   Male
     Bright, Upbeat
t-BR-BrendaNeural                    Female
t-BR-DonatoNeural                    Male
t-BR-ElzaNeural                      Female
t-BR-FabioNeural                     Male
t-BR-FranciscaNeural                 Female
     Cheerful, Crisp
t-BR-GiovannaNeural                  Female
t-BR-HumbertoNeural                  Male
t-BR-JulioNeural                     Male
t-BR-LeilaNeural                     Female
t-BR-LeticiaNeural                   Female
     Curious, Cheerful
t-BR-MacerioMultilingualNeural       Male
     Clear, Confident, Upbeat
t-BR-ManuelaNeural                   Female
t-BR-NicolauNeural                   Male
t-BR-ThalitaMultilingualNeural       Female
     Confident, Formal, Warm, Cheerful, Casual
t-BR-ThalitaNeural                   Female
     Confident, Formal
t-BR-ValerioNeural                   Male
t-BR-YaraNeural                      Female
     Well-Rounded, Animated, Bright
t-PT-DuarteNeural                    Male
     Serious, Deep
t-PT-FernandaNeural                  Female
     Crisp, Bright, Clear
t-PT-RaquelNeural                    Female
     Calm, Bright
o-RO-AlinaNeural                     Female
o-RO-EmilNeural                      Male
u-RU-DariyaNeural                    Female
     Crisp, Bright, Clear
u-RU-DmitryNeural                    Male
u-RU-SvetlanaNeural                  Female
i-LK-SameeraNeural                   Male
i-LK-ThiliniNeural                   Female
k-SK-LukasNeural                     Male
k-SK-ViktoriaNeural                  Female
l-SI-PetraNeural                     Female
l-SI-RokNeural                       Male
o-SO-MuuseNeural                     Male
o-SO-UbaxNeural                      Female
q-AL-AnilaNeural                     Female
q-AL-IlirNeural                      Male
r-Latn-RS-NicholasNeural             Male
r-Latn-RS-SophieNeural               Female
r-RS-NicholasNeural                  Male
r-RS-SophieNeural                    Female
u-ID-JajangNeural                    Male
u-ID-TutiNeural                      Female
v-SE-HilleviNeural                   Female
     Crisp, Bright, Clear
v-SE-MattiasNeural                   Male
v-SE-SofieNeural                     Female
w-KE-RafikiNeural                    Male
w-KE-ZuriNeural                      Female
w-TZ-DaudiNeural                     Male
w-TZ-RehemaNeural                    Female
a-IN-PallaviNeural                   Female
a-IN-ValluvarNeural                  Male
a-LK-KumarNeural                     Male
a-LK-SaranyaNeural                   Female
a-MY-KaniNeural                      Female
a-MY-SuryaNeural                     Male
a-SG-AnbuNeural                      Male
a-SG-VenbaNeural                     Female
e-IN-MohanNeural                     Male
e-IN-ShrutiNeural                    Female
h-TH-AcharaNeural                    Female
     Crisp, Bright, Clear
h-TH-NiwatNeural                     Male
h-TH-PremwadeeNeural                 Female
r-TR-AhmetNeural                     Male
r-TR-EmelNeural                      Female
     Crisp, Bright, Clear
k-UA-OstapNeural                     Male
k-UA-PolinaNeural                    Female
r-IN-GulNeural                       Female
r-IN-SalmanNeural                    Male
r-PK-AsadNeural                      Male
r-PK-UzmaNeural                      Female
z-UZ-MadinaNeural                    Female
z-UZ-SardorNeural                    Male
i-VN-HoaiMyNeural                    Female
i-VN-NamMinhNeural                   Male
uu-CN-XiaotongNeural                 Female
     Warm, Friendly, Soothing
uu-CN-YunzheNeural                   Male
     Calm, Deep, Gentle
yue-CN-XiaoMinNeural                  Female
     Bright, Crisp, Confident
yue-CN-YunSongNeural                  Male
     Deep, Calm, Formal
h-CN-XiaochenMultilingualNeural      Female
     Friendly, Casual, Upbeat
h-CN-XiaochenNeural                  Female
     Friendly, Casual, Upbeat
h-CN-XiaohanNeural                   Female
     Gentle, Warm, Emotional
h-CN-XiaomengNeural                  Female
     Gentle, Upbeat, Friendly
h-CN-XiaomoNeural                    Female
     Deep, Casual, Calm
h-CN-XiaoqiuNeural                   Female
     Calm, Engaging, Soothing
h-CN-XiaorouNeural                   Female
     Cheerful, Engaging, Pleasant
h-CN-XiaoruiNeural                   Female
     Confident, Emotional, Hoarse
h-CN-XiaoshuangMultilingualNeural    Female
h-CN-XiaoshuangNeural                Female
     Crisp, Cheerful, Bright
h-CN-XiaoxiaoDialectsNeural          Female
     Warm, Animated, Bright
h-CN-XiaoxiaoMultilingualNeural      Female
     Warm, Animated, Bright
h-CN-XiaoxiaoNeural                  Female
     Warm, Well-Rounded, Animated
h-CN-XiaoyanNeural                   Female
     Warm, Gentle, Empathetic
h-CN-XiaoyiNeural                    Female
     Bright, Emotional, Engaging
h-CN-XiaoyouMultilingualNeural       Female
h-CN-XiaoyouNeural                   Female
     Crisp, Cheerful, Bright
h-CN-XiaoyuMultilingualNeural        Female
     Deep, Confident, Casual
h-CN-XiaozhenNeural                  Female
     Calm, Serious, Confident
h-CN-YunfanMultilingualNeural        Male
h-CN-YunfengNeural                   Male
     Confident, Animated, Emotional
h-CN-YunhaoNeural                    Male
     Warm, Soft, Upbeat
h-CN-YunjianNeural                   Male
     Deep, Casual, Engaging
h-CN-YunjieNeural                    Male
     Casual, Confident, Warm
h-CN-YunxiNeural                     Male
     Bright, Animated, Cheerful
h-CN-YunxiaNeural                    Male
     Cheerful, Friendly, Emotional
h-CN-YunxiaoMultilingualNeural       Male
     Gentle, Casual, Friendly
h-CN-YunyangNeural                   Male
     Formal, Deep, Calm
h-CN-YunyeNeural                     Male
     Casual, Deep, Calm
h-CN-YunyiMultilingualNeural         Male
     Gentle, Casual, Friendly
h-CN-YunzeNeural                     Male
     Deep, Confident, Formal
h-CN-guangxi-YunqiNeural             Male
     Engaging, Casual, Animated
h-CN-henan-YundengNeural             Male
     Casual, Friendly, Animated
h-CN-liaoning-XiaobeiNeural          Female
     Friendly, Casual, Gentle
h-CN-liaoning-YunbiaoNeural          Male
     Confident, Casual, Cheerful
h-CN-shaanxi-XiaoniNeural            Female
     Confident, Engaging, Casual
h-CN-shandong-YunxiangNeural         Male
     Casual, Animated, Strong
h-CN-sichuan-YunxiNeural             Male
     Casual, Animated, Gentle
h-HK-HiuGaaiNeural                   Female
     Crisp, Bright, Clear
h-HK-HiuMaanNeural                   Female
     Bright, Upbeat
h-HK-WanLungNeural                   Male
     Calm, Formal
h-TW-HsiaoChenNeural                 Female
     Soft, Caring
h-TW-HsiaoYuNeural                   Female
     Crisp, Bright, Clear
h-TW-YunJheNeural                    Male
     Engaging, Gentle
uu-ZA-ThandoNeural                    Female
uu-ZA-ThembaNeural                    Male
'''


class GenerationWorker(QtCore.QThread):
    status_changed = QtCore.pyqtSignal(str)
    success = QtCore.pyqtSignal(str)
    error = QtCore.pyqtSignal(str)

    def __init__(self, text: str, voice: str, ffmpeg_args, sox_args, output_path: str, parent=None):
        super().__init__(parent)
        self.text = text
        self.voice = voice
        self.ffmpeg_args = ffmpeg_args
        self.sox_args = sox_args
        self.output_path = Path(output_path)

    def run(self):
        temp_dir = Path(tempfile.gettempdir())
        temp_mp3 = temp_dir / "voice_creator_temp.mp3"
        temp_wav = temp_dir / "voice_creator_temp.wav"

        try:
            if self.output_path.parent:
                self.output_path.parent.mkdir(parents=True, exist_ok=True)

            tts_command = self._build_tts_command(temp_mp3)

            self.status_changed.emit("Step 1/3: Generating TTS...")
            result = subprocess.run(tts_command, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                raise RuntimeError(self._format_failure("edge-tts", result))

            self.status_changed.emit("Step 2/3: Converting with FFmpeg...")
            ffmpeg_command = ["ffmpeg", "-i", str(temp_mp3), "-y"] + self.ffmpeg_args + [str(temp_wav)]
            result = subprocess.run(ffmpeg_command, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                raise RuntimeError(self._format_failure("ffmpeg", result))

            self.status_changed.emit("Step 3/3: Applying Sox effects...")
            sox_command = ["sox", str(temp_wav), str(self.output_path)] + self.sox_args
            result = subprocess.run(sox_command, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                raise RuntimeError(self._format_failure("sox", result))

            self.success.emit(str(self.output_path))
        except FileNotFoundError as exc:
            self.error.emit(
                f"Command not found: {exc.filename}.\n\n"
                "Make sure edge-tts, ffmpeg, and sox are installed and available in your PATH."
            )
        except Exception as exc:
            self.error.emit(str(exc))
        finally:
            for temp_file in (temp_mp3, temp_wav):
                try:
                    if temp_file.exists():
                        temp_file.unlink()
                except Exception:
                    pass

    def _build_tts_command(self, temp_mp3: Path):
        edge_tts_executable = shutil.which("edge-tts")
        if edge_tts_executable:
            return [
                edge_tts_executable,
                "--voice", self.voice,
                "--text", self.text,
                "--write-media", str(temp_mp3),
            ]

        python_candidates = [sys.executable, shutil.which("python3"), shutil.which("python")]
        for candidate in python_candidates:
            if candidate:
                return [
                    candidate,
                    "-m",
                    "edge_tts",
                    "--voice", self.voice,
                    "--text", self.text,
                    "--write-media", str(temp_mp3),
                ]

        raise RuntimeError("Could not locate the edge-tts command or a Python interpreter to run it.")

    @staticmethod
    def _format_failure(command: str, result: subprocess.CompletedProcess) -> str:
        stderr = (result.stderr or "").strip()
        stdout = (result.stdout or "").strip()
        details = stderr or stdout or "Unknown error"
        return f"{command} failed: {details}"


def parse_voices(raw_list):
    """Parses the raw voice list from edge-tts into a clean list of voice names."""
    voices = []
    for line in raw_list.strip().split('\n'):
        match = re.match(r'^([a-z]{2}-[A-Z]{2}-\w+Neural)', line)
        if match:
            voices.append(match.group(1))
    return sorted(voices)


class VoiceCreatorWindow(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Voice Creator")
        self.resize(720, 520)

        self.worker = None
        self.voices = parse_voices(VOICE_LIST_RAW)
        extra_swedish = [voice for voice in SWEDISH_VOICES if voice not in self.voices]
        if extra_swedish:
            self.voices.extend(extra_swedish)
            self.voices.sort()

        central_widget = QtWidgets.QWidget()
        self.setCentralWidget(central_widget)

        layout = QtWidgets.QGridLayout(central_widget)
        layout.setColumnStretch(1, 1)
        layout.setVerticalSpacing(12)

        # Text input
        layout.addWidget(QtWidgets.QLabel("Text:"), 0, 0, alignment=QT_ALIGN_TOP)
        self.text_input = QtWidgets.QTextEdit()
        self.text_input.setPlaceholderText("Enter the text you want to convert to speech")
        self.text_input.setPlainText("Hej, detta är ett test av text-till-tal-systemet.")
        layout.addWidget(self.text_input, 0, 1)

        # Voice selection
        layout.addWidget(QtWidgets.QLabel("Voice:"), 1, 0)
        self.voice_combo = QtWidgets.QComboBox()
        self.voice_combo.addItems(self.voices)
        default_voice = "sv-SE-SofieNeural"
        if default_voice in self.voices:
            self.voice_combo.setCurrentIndex(self.voices.index(default_voice))
        layout.addWidget(self.voice_combo, 1, 1)

        # FFmpeg settings
        layout.addWidget(QtWidgets.QLabel("FFmpeg Settings:"), 2, 0)
        self.ffmpeg_input = QtWidgets.QLineEdit("-ar 44100 -ac 1")
        layout.addWidget(self.ffmpeg_input, 2, 1)

        # Sox effects
        layout.addWidget(QtWidgets.QLabel("Sox Effects:"), 3, 0)
        self.sox_input = QtWidgets.QLineEdit("reverb 50 pitch -200")
        layout.addWidget(self.sox_input, 3, 1)

        # Output file picker
        layout.addWidget(QtWidgets.QLabel("Output File:"), 4, 0)
        output_layout = QtWidgets.QHBoxLayout()
        self.output_path_edit = QtWidgets.QLineEdit()
        self.output_path_edit.setReadOnly(True)
        output_layout.addWidget(self.output_path_edit)
        browse_button = QtWidgets.QPushButton("Browse...")
        browse_button.clicked.connect(self.choose_output_file)
        output_layout.addWidget(browse_button)
        layout.addLayout(output_layout, 4, 1)

        # Generate button
        self.generate_button = QtWidgets.QPushButton("Generate")
        self.generate_button.clicked.connect(self.start_generation)
        layout.addWidget(self.generate_button, 5, 0, 1, 2)

        # Status bar
        self.status_bar = self.statusBar()
        self.status_bar.showMessage("Ready")

    def choose_output_file(self):
        path, _ = QtWidgets.QFileDialog.getSaveFileName(
            self,
            "Save output file",
            "",
            "WAV files (*.wav);;All files (*.*)",
        )
        if path:
            self.output_path_edit.setText(path)

    def start_generation(self):
        text = self.text_input.toPlainText().strip()
        voice = self.voice_combo.currentText().strip()
        ffmpeg_args = shlex.split(self.ffmpeg_input.text())
        sox_args = shlex.split(self.sox_input.text())
        output_path = self.output_path_edit.text().strip()

        if not text or not voice or not output_path:
            QtWidgets.QMessageBox.critical(self, "Error", "Text, voice, and output file must be specified.")
            return

        self.generate_button.setEnabled(False)
        self.status_bar.showMessage("Starting...")

        self.worker = GenerationWorker(text, voice, ffmpeg_args, sox_args, output_path, self)
        self.worker.status_changed.connect(self.status_bar.showMessage)
        self.worker.success.connect(self.on_generation_success)
        self.worker.error.connect(self.on_generation_error)
        self.worker.finished.connect(self.on_generation_finished)
        self.worker.start()

    def on_generation_success(self, output_file: str):
        self.status_bar.showMessage(f"Success! Saved to {output_file}")
        QtWidgets.QMessageBox.information(
            self,
            "Success",
            f"Audio file successfully generated at:\n{output_file}",
        )

    def on_generation_error(self, message: str):
        self.status_bar.showMessage("Error occurred.")
        QtWidgets.QMessageBox.critical(self, "Error", message)

    def on_generation_finished(self):
        self.generate_button.setEnabled(True)
        self.worker = None


if __name__ == "__main__":
    app = QtWidgets.QApplication(sys.argv)
    window = VoiceCreatorWindow()
    window.show()
    sys.exit(qt_exec(app))
