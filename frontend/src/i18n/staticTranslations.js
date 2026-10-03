const STATIC_TRANSLATIONS = {
  en: {
    // ========================================================
    // COMMON
    // ========================================================

    "common.backHome":
      "Back to home",

    "common.back":
      "Back",

    "common.save":
      "Save",

    "common.cancel":
      "Cancel",

    "common.next":
      "Next",

    "common.previous":
      "Previous",

    "common.refresh":
      "Refresh",

    "common.signOut":
      "Sign out",

    "common.dashboard":
      "Dashboard",

    "common.orders":
      "Orders",

    "common.createOrder":
      "Create order",

    "common.scheduledDeliveries":
      "Scheduled deliveries",

    "common.deliveryWindow":
      "Delivery window",

    "common.assignedDepot":
      "Assigned depot",

    "common.profile":
      "Profile",

    "common.notifications":
      "Notifications",

    "common.trackDelivery":
      "Track delivery",

    "common.reportIssue":
      "Report issue",

    "common.loading":
      "Loading...",

    "common.loadingWaypoint":
      "Loading Waypoint...",

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    "auth.secureStaffAccess":
      "Secure staff access",

    "auth.signInTitle":
      "Sign in to Waypoint",

    "auth.signInDescription":
      "Use your assigned User ID or registered email and password to access your workspace.",

    "auth.userIdOrEmail":
      "User ID or Email",

    "auth.userIdPlaceholder":
      "Enter User ID or email",

    "auth.password":
      "Password",

    "auth.passwordPlaceholder":
      "Enter your password",

    "auth.forgotPassword":
      "Forgot password?",

    "auth.signIn":
      "Sign in",

    "auth.signingIn":
      "Signing in...",

    "auth.administratorAccess":
      "Administrator access",

    "auth.restrictedNotice":
      "Access is restricted to authorized Waypoint operations personnel.",

    "auth.showPassword":
      "Show password",

    "auth.hidePassword":
      "Hide password",

    "auth.identifierRequired":
      "Enter your User ID or email.",

    "auth.passwordRequired":
      "Enter your password.",

    "auth.signInFailed":
      "Unable to sign in. Please try again.",

    // ========================================================
    // LOGIN HERO
    // ========================================================

    "auth.heroEyebrow":
      "Delivery Operations",

    "auth.heroTitleLine1":
      "Smarter delivery",

    "auth.heroTitleLine2":
      "operations,",

    "auth.heroTitleLine3":
      "from depot to store.",

    "auth.heroDescription":
      "Coordinate store orders, dispatch, loading and deliveries through one connected Waypoint operations network.",

    "auth.roleBasedAccess":
      "Role-based access",

    "auth.secureOperations":
      "Secure operations",

    "auth.connectedDeliveryNetwork":
      "Connected delivery network",

    "auth.distributionNetwork":
      "Peliyagoda & Kandy distribution network",

    // ========================================================
    // PASSWORD RECOVERY
    // ========================================================

    "recovery.backToSignIn":
      "Back to sign in",

    "recovery.accountRecovery":
      "Account recovery",

    "recovery.adminRecovery":
      "Administrator recovery",

    "recovery.forgotTitle":
      "Forgot your password?",

    "recovery.adminEmailTitle":
      "Verify your administrator email",

    "recovery.forgotDescription":
      "Enter your User ID or registered email. If a matching account exists, we will send a verification code to its registered email address.",

    "recovery.adminEmailDescription":
      "Confirm the administrator email below, then send a verification code to continue securely.",

    "recovery.userIdOrEmail":
      "User ID or Email",

    "recovery.adminEmail":
      "Administrator Email",

    "recovery.userIdPlaceholder":
      "Enter User ID or email",

    "recovery.adminEmailPlaceholder":
      "Enter administrator email",

    "recovery.identifierRequired":
      "Enter your User ID or registered email.",

    "recovery.adminEmailRequired":
      "Enter your registered administrator email.",

    "recovery.sendCode":
      "Send verification code",

    "recovery.sendingCode":
      "Sending code...",

    "recovery.requestFailed":
      "Unable to request a verification code.",

    "recovery.securityNotice":
      "For security, Waypoint does not reveal whether the entered account exists.",

    "recovery.emailVerification":
      "Email verification",

    "recovery.enterCodeTitle":
      "Enter your 6-digit code",

    "recovery.codeDescription":
      "If the account exists, Waypoint sent a code to its registered email. The code expires after 10 minutes.",

    "recovery.account":
      "Account:",

    "recovery.verificationCode":
      "Verification code",

    "recovery.codeRequired":
      "Enter the 6-digit verification code.",

    "recovery.verifyCode":
      "Verify code",

    "recovery.verifying":
      "Verifying...",

    "recovery.verifyFailed":
      "Unable to verify the code.",

    "recovery.changeAccount":
      "Change account",

    "recovery.resendCode":
      "Resend code",

    "recovery.resendIn":
      "Resend in {seconds}s",

    "recovery.sending":
      "Sending...",

    "recovery.resendSuccess":
      "If the account is valid, a new verification code has been sent.",

    "recovery.resendFailed":
      "Unable to resend the verification code.",

    "recovery.secureReset":
      "Secure password reset",

    "recovery.createPasswordTitle":
      "Create a new password",

    "recovery.createPasswordDescription":
      "Your identity has been verified. Create a new password for your Waypoint account.",

    "recovery.newPassword":
      "New password",

    "recovery.confirmPassword":
      "Confirm new password",

    "recovery.passwordRequirements":
      "Password requirements",

    "recovery.requirementLength":
      "10+ characters",

    "recovery.requirementUppercase":
      "Uppercase letter",

    "recovery.requirementLowercase":
      "Lowercase letter",

    "recovery.requirementNumber":
      "Number",

    "recovery.requirementSpecial":
      "Special character",

    "recovery.passwordWeak":
      "Your new password does not meet all security requirements.",

    "recovery.passwordMismatch":
      "New password and confirmation do not match.",

    "recovery.resetPassword":
      "Reset password",

    "recovery.resettingPassword":
      "Resetting password...",

    "recovery.resetFailed":
      "Unable to reset your password.",

    "recovery.passwordUpdated":
      "Password updated",

    "recovery.resetSuccessful":
      "Reset successful",

    "recovery.resetSuccessDescription":
      "Your Waypoint password has been changed successfully. You can now sign in using your new password.",

    "recovery.showPassword":
      "Show password",

    "recovery.hidePassword":
      "Hide password",

    // ========================================================
    // LANDING — retained for later integration
    // ========================================================

    "landing.home":
      "Home",

    "landing.stores":
      "Our Stores",

    "landing.about":
      "About",

    "landing.contact":
      "Contact",

    "landing.staffLogin":
      "Staff Login",

    "landing.adminLogin":
      "Administrator Login",

    "landing.deliveryOperations":
      "Delivery Operations",

    "landing.roleBasedAccess":
      "Role-based access",

    "landing.secureOperations":
      "Secure operations",

    "landing.connectedNetwork":
      "Connected delivery network",

    // ========================================================
    // ROLES
    // ========================================================

    "role.admin":
      "Administrator",

    "role.storeManager":
      "Store Manager",

    "role.dispatcher":
      "Dispatcher",

    "role.loader":
      "Loader",

    "role.driver":
      "Driver",
  },

  si: {
    // ========================================================
    // COMMON
    // ========================================================

    "common.backHome":
      "මුල් පිටුවට",

    "common.back":
      "ආපසු",

    "common.save":
      "සුරකින්න",

    "common.cancel":
      "අවලංගු කරන්න",

    "common.next":
      "ඊළඟ",

    "common.previous":
      "පෙර",

    "common.refresh":
      "යාවත්කාලීන කරන්න",

    "common.signOut":
      "ඉවත් වන්න",

    "common.dashboard":
      "ඩෑෂ්බෝඩ්",

    "common.orders":
      "ඇණවුම්",

    "common.createOrder":
      "නව ඇණවුමක්",

    "common.scheduledDeliveries":
      "නියමිත බෙදාහැරීම්",

    "common.deliveryWindow":
      "බෙදාහැරීමේ කාල සීමාව",

    "common.assignedDepot":
      "අනුයුක්ත ඩිපෝව",

    "common.profile":
      "පැතිකඩ",

    "common.notifications":
      "දැනුම්දීම්",

    "common.trackDelivery":
      "බෙදාහැරීම අනුගමනය කරන්න",

    "common.reportIssue":
      "ගැටලුවක් වාර්තා කරන්න",

    "common.loading":
      "පූරණය වෙමින්...",

    "common.loadingWaypoint":
      "Waypoint පූරණය වෙමින්...",

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    "auth.secureStaffAccess":
      "ආරක්ෂිත කාර්ය මණ්ඩල ප්‍රවේශය",

    "auth.signInTitle":
      "Waypoint වෙත පිවිසෙන්න",

    "auth.signInDescription":
      "ඔබට ලබා දී ඇති User ID එක හෝ ලියාපදිංචි Email ලිපිනය සහ මුරපදය භාවිතා කර Workspace එකට පිවිසෙන්න.",

    "auth.userIdOrEmail":
      "User ID හෝ Email",

    "auth.userIdPlaceholder":
      "User ID හෝ Email ඇතුළත් කරන්න",

    "auth.password":
      "මුරපදය",

    "auth.passwordPlaceholder":
      "මුරපදය ඇතුළත් කරන්න",

    "auth.forgotPassword":
      "මුරපදය අමතකද?",

    "auth.signIn":
      "පිවිසෙන්න",

    "auth.signingIn":
      "පිවිසෙමින්...",

    "auth.administratorAccess":
      "පරිපාලක ප්‍රවේශය",

    "auth.restrictedNotice":
      "අනුමත Waypoint කාර්ය මණ්ඩලයට පමණක් ප්‍රවේශය ලබා දේ.",

    "auth.showPassword":
      "මුරපදය පෙන්වන්න",

    "auth.hidePassword":
      "මුරපදය සඟවන්න",

    "auth.identifierRequired":
      "User ID හෝ Email ඇතුළත් කරන්න.",

    "auth.passwordRequired":
      "මුරපදය ඇතුළත් කරන්න.",

    "auth.signInFailed":
      "පිවිසීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",

    // ========================================================
    // LOGIN HERO
    // ========================================================

    "auth.heroEyebrow":
      "බෙදාහැරීමේ මෙහෙයුම්",

    "auth.heroTitleLine1":
      "වඩා කාර්යක්ෂම",

    "auth.heroTitleLine2":
      "බෙදාහැරීමේ මෙහෙයුම්,",

    "auth.heroTitleLine3":
      "ඩිපෝවෙන් වෙළඳසැල දක්වා.",

    "auth.heroDescription":
      "වෙළඳසැල් ඇණවුම්, Dispatch, Loading සහ බෙදාහැරීම් එක් සම්බන්ධිත Waypoint මෙහෙයුම් ජාලයක් හරහා කළමනාකරණය කරන්න.",

    "auth.roleBasedAccess":
      "භූමිකා මත ප්‍රවේශය",

    "auth.secureOperations":
      "ආරක්ෂිත මෙහෙයුම්",

    "auth.connectedDeliveryNetwork":
      "සම්බන්ධිත බෙදාහැරීමේ ජාලය",

    "auth.distributionNetwork":
      "Peliyagoda & Kandy බෙදාහැරීමේ ජාලය",

    // ========================================================
    // PASSWORD RECOVERY
    // ========================================================

    "recovery.backToSignIn":
      "පිවිසුමට ආපසු",

    "recovery.accountRecovery":
      "ගිණුම් ප්‍රතිසාධනය",

    "recovery.adminRecovery":
      "පරිපාලක ගිණුම් ප්‍රතිසාධනය",

    "recovery.forgotTitle":
      "මුරපදය අමතකද?",

    "recovery.adminEmailTitle":
      "පරිපාලක Email ලිපිනය තහවුරු කරන්න",

    "recovery.forgotDescription":
      "ඔබගේ User ID හෝ ලියාපදිංචි Email ලිපිනය ඇතුළත් කරන්න. ගැළපෙන ගිණුමක් තිබේ නම්, ලියාපදිංචි Email ලිපිනයට තහවුරු කිරීමේ කේතයක් යවනු ලැබේ.",

    "recovery.adminEmailDescription":
      "පහත පරිපාලක Email ලිපිනය තහවුරු කර, ආරක්ෂිතව ඉදිරියට යාමට තහවුරු කිරීමේ කේතයක් යවන්න.",

    "recovery.userIdOrEmail":
      "User ID හෝ Email",

    "recovery.adminEmail":
      "පරිපාලක Email",

    "recovery.userIdPlaceholder":
      "User ID හෝ Email ඇතුළත් කරන්න",

    "recovery.adminEmailPlaceholder":
      "පරිපාලක Email ඇතුළත් කරන්න",

    "recovery.identifierRequired":
      "User ID හෝ ලියාපදිංචි Email ඇතුළත් කරන්න.",

    "recovery.adminEmailRequired":
      "ලියාපදිංචි පරිපාලක Email ලිපිනය ඇතුළත් කරන්න.",

    "recovery.sendCode":
      "තහවුරු කිරීමේ කේතය යවන්න",

    "recovery.sendingCode":
      "කේතය යවමින්...",

    "recovery.requestFailed":
      "තහවුරු කිරීමේ කේතය ඉල්ලීමට නොහැකි විය.",

    "recovery.securityNotice":
      "ආරක්ෂාව සඳහා, ඇතුළත් කළ ගිණුම පවතින්නේද යන්න Waypoint හෙළි නොකරයි.",

    "recovery.emailVerification":
      "Email තහවුරු කිරීම",

    "recovery.enterCodeTitle":
      "අංක 6ක තහවුරු කිරීමේ කේතය ඇතුළත් කරන්න",

    "recovery.codeDescription":
      "ගිණුම පවතී නම්, එහි ලියාපදිංචි Email ලිපිනයට Waypoint කේතයක් යවා ඇත. කේතය විනාඩි 10කින් කල් ඉකුත් වේ.",

    "recovery.account":
      "ගිණුම:",

    "recovery.verificationCode":
      "තහවුරු කිරීමේ කේතය",

    "recovery.codeRequired":
      "අංක 6ක තහවුරු කිරීමේ කේතය ඇතුළත් කරන්න.",

    "recovery.verifyCode":
      "කේතය තහවුරු කරන්න",

    "recovery.verifying":
      "තහවුරු කරමින්...",

    "recovery.verifyFailed":
      "කේතය තහවුරු කිරීමට නොහැකි විය.",

    "recovery.changeAccount":
      "ගිණුම වෙනස් කරන්න",

    "recovery.resendCode":
      "කේතය නැවත යවන්න",

    "recovery.resendIn":
      "තත්පර {seconds}කින් නැවත යවන්න",

    "recovery.sending":
      "යවමින්...",

    "recovery.resendSuccess":
      "ගිණුම වලංගු නම්, නව තහවුරු කිරීමේ කේතයක් යවා ඇත.",

    "recovery.resendFailed":
      "තහවුරු කිරීමේ කේතය නැවත යැවීමට නොහැකි විය.",

    "recovery.secureReset":
      "ආරක්ෂිත මුරපද යළි සැකසීම",

    "recovery.createPasswordTitle":
      "නව මුරපදයක් සාදන්න",

    "recovery.createPasswordDescription":
      "ඔබගේ අනන්‍යතාව තහවුරු කර ඇත. Waypoint ගිණුම සඳහා නව මුරපදයක් සාදන්න.",

    "recovery.newPassword":
      "නව මුරපදය",

    "recovery.confirmPassword":
      "නව මුරපදය තහවුරු කරන්න",

    "recovery.passwordRequirements":
      "මුරපද අවශ්‍යතා",

    "recovery.requirementLength":
      "අක්ෂර 10ක් හෝ වැඩි",

    "recovery.requirementUppercase":
      "ඉංග්‍රීසි ලොකු අකුරක්",

    "recovery.requirementLowercase":
      "ඉංග්‍රීසි කුඩා අකුරක්",

    "recovery.requirementNumber":
      "අංකයක්",

    "recovery.requirementSpecial":
      "විශේෂ සංකේතයක්",

    "recovery.passwordWeak":
      "නව මුරපදය සියලු ආරක්ෂක අවශ්‍යතා සපුරාලන්නේ නැත.",

    "recovery.passwordMismatch":
      "නව මුරපදය සහ තහවුරු කිරීමේ මුරපදය ගැළපෙන්නේ නැත.",

    "recovery.resetPassword":
      "මුරපදය යළි සකසන්න",

    "recovery.resettingPassword":
      "මුරපදය යළි සකසමින්...",

    "recovery.resetFailed":
      "මුරපදය යළි සැකසීමට නොහැකි විය.",

    "recovery.passwordUpdated":
      "මුරපදය යාවත්කාලීන විය",

    "recovery.resetSuccessful":
      "යළි සැකසීම සාර්ථකයි",

    "recovery.resetSuccessDescription":
      "Waypoint මුරපදය සාර්ථකව වෙනස් කර ඇත. දැන් නව මුරපදය භාවිතා කර පිවිසිය හැක.",

    "recovery.showPassword":
      "මුරපදය පෙන්වන්න",

    "recovery.hidePassword":
      "මුරපදය සඟවන්න",

    // ========================================================
    // LANDING
    // ========================================================

    "landing.home":
      "මුල් පිටුව",

    "landing.stores":
      "අපගේ වෙළඳසැල්",

    "landing.about":
      "අප ගැන",

    "landing.contact":
      "සම්බන්ධ වන්න",

    "landing.staffLogin":
      "කාර්ය මණ්ඩල පිවිසුම",

    "landing.adminLogin":
      "පරිපාලක පිවිසුම",

    "landing.deliveryOperations":
      "බෙදාහැරීමේ මෙහෙයුම්",

    "landing.roleBasedAccess":
      "භූමිකා මත ප්‍රවේශය",

    "landing.secureOperations":
      "ආරක්ෂිත මෙහෙයුම්",

    "landing.connectedNetwork":
      "සම්බන්ධිත බෙදාහැරීමේ ජාලය",

    // ========================================================
    // ROLES
    // ========================================================

    "role.admin":
      "පරිපාලක",

    "role.storeManager":
      "Store Manager",

    "role.dispatcher":
      "Dispatcher",

    "role.loader":
      "Loader",

    "role.driver":
      "Driver",
  },

  ta: {
    // ========================================================
    // COMMON
    // ========================================================

    "common.backHome":
      "முகப்புக்கு",

    "common.back":
      "பின்செல்",

    "common.save":
      "சேமி",

    "common.cancel":
      "ரத்து செய்",

    "common.next":
      "அடுத்து",

    "common.previous":
      "முந்தைய",

    "common.refresh":
      "புதுப்பி",

    "common.signOut":
      "வெளியேறு",

    "common.dashboard":
      "டாஷ்போர்டு",

    "common.orders":
      "ஆர்டர்கள்",

    "common.createOrder":
      "புதிய ஆர்டர்",

    "common.scheduledDeliveries":
      "திட்டமிட்ட விநியோகங்கள்",

    "common.deliveryWindow":
      "விநியோக நேரச் சாளரம்",

    "common.assignedDepot":
      "ஒதுக்கப்பட்ட டிப்போ",

    "common.profile":
      "சுயவிவரம்",

    "common.notifications":
      "அறிவிப்புகள்",

    "common.trackDelivery":
      "விநியோகத்தை கண்காணிக்க",

    "common.reportIssue":
      "பிரச்சினையை தெரிவிக்க",

    "common.loading":
      "ஏற்றுகிறது...",

    "common.loadingWaypoint":
      "Waypoint ஏற்றுகிறது...",

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    "auth.secureStaffAccess":
      "பாதுகாப்பான பணியாளர் அணுகல்",

    "auth.signInTitle":
      "Waypoint-இல் உள்நுழையவும்",

    "auth.signInDescription":
      "உங்களுக்கு ஒதுக்கப்பட்ட User ID அல்லது பதிவு செய்யப்பட்ட Email மற்றும் கடவுச்சொல்லைப் பயன்படுத்தி Workspace-ஐ அணுகவும்.",

    "auth.userIdOrEmail":
      "User ID அல்லது Email",

    "auth.userIdPlaceholder":
      "User ID அல்லது Email உள்ளிடவும்",

    "auth.password":
      "கடவுச்சொல்",

    "auth.passwordPlaceholder":
      "கடவுச்சொல்லை உள்ளிடவும்",

    "auth.forgotPassword":
      "கடவுச்சொல் மறந்துவிட்டதா?",

    "auth.signIn":
      "உள்நுழை",

    "auth.signingIn":
      "உள்நுழைகிறது...",

    "auth.administratorAccess":
      "நிர்வாகி அணுகல்",

    "auth.restrictedNotice":
      "அங்கீகரிக்கப்பட்ட Waypoint பணியாளர்களுக்கு மட்டுமே அணுகல் வழங்கப்படும்.",

    "auth.showPassword":
      "கடவுச்சொல்லைக் காட்டு",

    "auth.hidePassword":
      "கடவுச்சொல்லை மறை",

    "auth.identifierRequired":
      "User ID அல்லது Email உள்ளிடவும்.",

    "auth.passwordRequired":
      "கடவுச்சொல்லை உள்ளிடவும்.",

    "auth.signInFailed":
      "உள்நுழைய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",

    // ========================================================
    // LOGIN HERO
    // ========================================================

    "auth.heroEyebrow":
      "விநியோக செயல்பாடுகள்",

    "auth.heroTitleLine1":
      "சிறந்த விநியோக",

    "auth.heroTitleLine2":
      "செயல்பாடுகள்,",

    "auth.heroTitleLine3":
      "டிப்போவிலிருந்து கடை வரை.",

    "auth.heroDescription":
      "கடை ஆர்டர்கள், Dispatch, Loading மற்றும் விநியோகங்களை ஒரே இணைக்கப்பட்ட Waypoint செயல்பாட்டு வலையமைப்பின் மூலம் நிர்வகிக்கவும்.",

    "auth.roleBasedAccess":
      "பங்கு அடிப்படையிலான அணுகல்",

    "auth.secureOperations":
      "பாதுகாப்பான செயல்பாடுகள்",

    "auth.connectedDeliveryNetwork":
      "இணைக்கப்பட்ட விநியோக வலையமைப்பு",

    "auth.distributionNetwork":
      "Peliyagoda & Kandy விநியோக வலையமைப்பு",

    // ========================================================
    // PASSWORD RECOVERY
    // ========================================================

    "recovery.backToSignIn":
      "உள்நுழைவுக்கு திரும்பு",

    "recovery.accountRecovery":
      "கணக்கு மீட்பு",

    "recovery.adminRecovery":
      "நிர்வாகி கணக்கு மீட்பு",

    "recovery.forgotTitle":
      "கடவுச்சொல் மறந்துவிட்டதா?",

    "recovery.adminEmailTitle":
      "நிர்வாகி Email-ஐ உறுதிப்படுத்தவும்",

    "recovery.forgotDescription":
      "உங்கள் User ID அல்லது பதிவு செய்யப்பட்ட Email முகவரியை உள்ளிடவும். பொருந்தும் கணக்கு இருந்தால், அதன் பதிவு செய்யப்பட்ட Email முகவரிக்கு சரிபார்ப்புக் குறியீடு அனுப்பப்படும்.",

    "recovery.adminEmailDescription":
      "கீழே உள்ள நிர்வாகி Email-ஐ உறுதிப்படுத்தி, பாதுகாப்பாக தொடர சரிபார்ப்புக் குறியீட்டை அனுப்பவும்.",

    "recovery.userIdOrEmail":
      "User ID அல்லது Email",

    "recovery.adminEmail":
      "நிர்வாகி Email",

    "recovery.userIdPlaceholder":
      "User ID அல்லது Email உள்ளிடவும்",

    "recovery.adminEmailPlaceholder":
      "நிர்வாகி Email உள்ளிடவும்",

    "recovery.identifierRequired":
      "User ID அல்லது பதிவு செய்யப்பட்ட Email-ஐ உள்ளிடவும்.",

    "recovery.adminEmailRequired":
      "பதிவு செய்யப்பட்ட நிர்வாகி Email-ஐ உள்ளிடவும்.",

    "recovery.sendCode":
      "சரிபார்ப்புக் குறியீட்டை அனுப்பு",

    "recovery.sendingCode":
      "குறியீடு அனுப்பப்படுகிறது...",

    "recovery.requestFailed":
      "சரிபார்ப்புக் குறியீட்டை கோர முடியவில்லை.",

    "recovery.securityNotice":
      "பாதுகாப்பிற்காக, உள்ளிடப்பட்ட கணக்கு உள்ளதா என்பதை Waypoint வெளிப்படுத்தாது.",

    "recovery.emailVerification":
      "Email சரிபார்ப்பு",

    "recovery.enterCodeTitle":
      "6 இலக்க சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்",

    "recovery.codeDescription":
      "கணக்கு இருந்தால், அதன் பதிவு செய்யப்பட்ட Email-க்கு Waypoint ஒரு குறியீட்டை அனுப்பியுள்ளது. குறியீடு 10 நிமிடங்களில் காலாவதியாகும்.",

    "recovery.account":
      "கணக்கு:",

    "recovery.verificationCode":
      "சரிபார்ப்புக் குறியீடு",

    "recovery.codeRequired":
      "6 இலக்க சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்.",

    "recovery.verifyCode":
      "குறியீட்டை சரிபார்",

    "recovery.verifying":
      "சரிபார்க்கப்படுகிறது...",

    "recovery.verifyFailed":
      "குறியீட்டை சரிபார்க்க முடியவில்லை.",

    "recovery.changeAccount":
      "கணக்கை மாற்று",

    "recovery.resendCode":
      "குறியீட்டை மீண்டும் அனுப்பு",

    "recovery.resendIn":
      "{seconds} வினாடிகளில் மீண்டும் அனுப்பு",

    "recovery.sending":
      "அனுப்பப்படுகிறது...",

    "recovery.resendSuccess":
      "கணக்கு செல்லுபடியாக இருந்தால், புதிய சரிபார்ப்புக் குறியீடு அனுப்பப்பட்டுள்ளது.",

    "recovery.resendFailed":
      "சரிபார்ப்புக் குறியீட்டை மீண்டும் அனுப்ப முடியவில்லை.",

    "recovery.secureReset":
      "பாதுகாப்பான கடவுச்சொல் மீட்டமைப்பு",

    "recovery.createPasswordTitle":
      "புதிய கடவுச்சொல்லை உருவாக்கவும்",

    "recovery.createPasswordDescription":
      "உங்கள் அடையாளம் சரிபார்க்கப்பட்டது. Waypoint கணக்கிற்காக புதிய கடவுச்சொல்லை உருவாக்கவும்.",

    "recovery.newPassword":
      "புதிய கடவுச்சொல்",

    "recovery.confirmPassword":
      "புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்",

    "recovery.passwordRequirements":
      "கடவுச்சொல் தேவைகள்",

    "recovery.requirementLength":
      "10 அல்லது அதற்கு மேற்பட்ட எழுத்துகள்",

    "recovery.requirementUppercase":
      "ஆங்கில பெரிய எழுத்து",

    "recovery.requirementLowercase":
      "ஆங்கில சிறிய எழுத்து",

    "recovery.requirementNumber":
      "எண்",

    "recovery.requirementSpecial":
      "சிறப்பு குறியீடு",

    "recovery.passwordWeak":
      "புதிய கடவுச்சொல் அனைத்து பாதுகாப்பு தேவைகளையும் பூர்த்தி செய்யவில்லை.",

    "recovery.passwordMismatch":
      "புதிய கடவுச்சொல் மற்றும் உறுதிப்படுத்தும் கடவுச்சொல் பொருந்தவில்லை.",

    "recovery.resetPassword":
      "கடவுச்சொல்லை மீட்டமை",

    "recovery.resettingPassword":
      "கடவுச்சொல் மீட்டமைக்கப்படுகிறது...",

    "recovery.resetFailed":
      "கடவுச்சொல்லை மீட்டமைக்க முடியவில்லை.",

    "recovery.passwordUpdated":
      "கடவுச்சொல் புதுப்பிக்கப்பட்டது",

    "recovery.resetSuccessful":
      "மீட்டமைப்பு வெற்றிகரமாக முடிந்தது",

    "recovery.resetSuccessDescription":
      "Waypoint கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது. இப்போது புதிய கடவுச்சொல்லைப் பயன்படுத்தி உள்நுழையலாம்.",

    "recovery.showPassword":
      "கடவுச்சொல்லைக் காட்டு",

    "recovery.hidePassword":
      "கடவுச்சொல்லை மறை",

    // ========================================================
    // LANDING
    // ========================================================

    "landing.home":
      "முகப்பு",

    "landing.stores":
      "எங்கள் கடைகள்",

    "landing.about":
      "எங்களைப் பற்றி",

    "landing.contact":
      "தொடர்பு",

    "landing.staffLogin":
      "பணியாளர் உள்நுழைவு",

    "landing.adminLogin":
      "நிர்வாகி உள்நுழைவு",

    "landing.deliveryOperations":
      "விநியோக செயல்பாடுகள்",

    "landing.roleBasedAccess":
      "பங்கு அடிப்படையிலான அணுகல்",

    "landing.secureOperations":
      "பாதுகாப்பான செயல்பாடுகள்",

    "landing.connectedNetwork":
      "இணைக்கப்பட்ட விநியோக வலையமைப்பு",

    // ========================================================
    // ROLES
    // ========================================================

    "role.admin":
      "நிர்வாகி",

    "role.storeManager":
      "Store Manager",

    "role.dispatcher":
      "Dispatcher",

    "role.loader":
      "Loader",

    "role.driver":
      "Driver",
  },
};

function interpolate(
  template,
  variables
) {
  if (
    !variables ||
    typeof variables !==
      "object"
  ) {
    return template;
  }

  return template.replace(
    /\{([a-zA-Z0-9_]+)\}/g,
    (
      match,
      key
    ) => {
      if (
        Object.prototype
          .hasOwnProperty.call(
            variables,
            key
          )
      ) {
        return String(
          variables[key]
        );
      }

      return match;
    }
  );
}

export function getStaticTranslation({
  language,
  key,
  fallback,
  variables,
}) {
  const selectedLanguage =
    STATIC_TRANSLATIONS[
      language
    ] ||
    STATIC_TRANSLATIONS.en;

  const englishText =
    STATIC_TRANSLATIONS.en[
      key
    ];

  const translatedText =
    selectedLanguage[
      key
    ];

  const resolvedText =
    translatedText ||
    englishText ||
    fallback ||
    key;

  return interpolate(
    resolvedText,
    variables
  );
}

export function hasStaticTranslation(
  key
) {
  return Boolean(
    STATIC_TRANSLATIONS.en[
      key
    ]
  );
}

export default STATIC_TRANSLATIONS;