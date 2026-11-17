/* Seletor de idioma + traduções (PT é o idioma original das páginas) */
(function(){
var NAMES={pt:"Português",en:"English",es:"Español",fr:"Français"},ORDER=["pt","en","es","fr"],IDX={en:0,es:1,fr:2},HTML={pt:"pt-PT",en:"en",es:"es",fr:"fr"};

var FL={
pt:'<svg viewBox="0 0 36 24" preserveAspectRatio="none"><rect width="36" height="24" fill="#D52B1E"/><rect width="14.4" height="24" fill="#046A38"/><circle cx="14.4" cy="12" r="4.6" fill="#FFCC00"/><circle cx="14.4" cy="12" r="2.3" fill="#D52B1E"/></svg>',
en:'<svg viewBox="0 0 36 24" preserveAspectRatio="none"><rect width="36" height="24" fill="#012169"/><path d="M0 0L36 24M36 0L0 24" stroke="#fff" stroke-width="4.8"/><path d="M0 0L36 24M36 0L0 24" stroke="#C8102E" stroke-width="1.6"/><path d="M18 0V24M0 12H36" stroke="#fff" stroke-width="8"/><path d="M18 0V24M0 12H36" stroke="#C8102E" stroke-width="4.8"/></svg>',
es:'<svg viewBox="0 0 36 24" preserveAspectRatio="none"><rect width="36" height="24" fill="#AA151B"/><rect y="6" width="36" height="12" fill="#F1BF00"/></svg>',
fr:'<svg viewBox="0 0 36 24" preserveAspectRatio="none"><rect width="36" height="24" fill="#fff"/><rect width="12" height="24" fill="#0055A4"/><rect x="24" width="12" height="24" fill="#EF4135"/></svg>'
};

/* chave = texto em português · valor = [inglês, espanhol, francês] */
var D={
"Cada":["Every", "Cada", "Chaque"],
"passo":["step", "paso", "pas"],
"Descobre porquê":["Discover why", "Descubre por qué", "Découvre pourquoi"],
"Mais longe.":["Further.", "Más lejos.", "Plus loin."],
"Por alguém.":["For someone.", "Por alguien.", "Pour quelqu’un."],
"A ATEC Palmela junta-se ao movimento #TodosOsPassosContam, da Fundação Galp. De 16 a 22 de novembro, os quilómetros das nossas turmas contribuem para uma causa comum.":["ATEC Palmela joins Fundação Galp’s #TodosOsPassosContam movement. From 16 to 22 November, the kilometres walked by our classes contribute to a shared cause.", "ATEC Palmela se une al movimiento #TodosOsPassosContam de la Fundação Galp. Del 16 al 22 de noviembre, los kilómetros de nuestras clases contribuyen a una causa común.", "ATEC Palmela rejoint le mouvement #TodosOsPassosContam de la Fundação Galp. Du 16 au 22 novembre, les kilomètres de nos classes contribuent à une cause commune."],
"de refeições: a meta nacional para a Rede de Emergência Alimentar.":["meals: the national goal for the Food Emergency Network.", "de comidas: la meta nacional para la Red de Emergencia Alimentaria.", "de repas : l’objectif national pour le Réseau d’urgence alimentaire."],
"Várias turmas.":["Many classes.", "Varias clases.", "Plusieurs classes."],
"Uma só equipa.":["One team.", "Un solo equipo.", "Une seule équipe."],
"A competição é entre turmas. A solidariedade é de todos.":["Classes compete. Everyone contributes.", "Las clases compiten. Todos contribuyen.", "Les classes rivalisent. Tout le monde contribue."],
"Cada grupo acompanha os seus passos no StepUp. Os delegados reúnem os registos e os quilómetros somam-se ao total da ATEC Palmela, a submeter na plataforma oficial do movimento.":["Each group tracks its steps in StepUp. Class representatives collect the records, and the kilometres are added to ATEC Palmela’s total for submission on the movement’s official platform.", "Cada grupo registra sus pasos en StepUp. Los delegados reúnen los registros y los kilómetros se suman al total de ATEC Palmela, que se envía a la plataforma oficial del movimiento.", "Chaque groupe suit ses pas sur StepUp. Les délégués rassemblent les relevés et les kilomètres sont ajoutés au total d’ATEC Palmela, à soumettre sur la plateforme officielle du mouvement."],
"O teu movimento.":["Your movement.", "Tu movimiento.", "Ton mouvement."],
"Uma refeição":["A meal", "Una comida", "Un repas"],
"para alguém.":["for someone.", "para alguien.", "pour quelqu’un."],
"PASSOS":["STEPS","PASOS","PAS"],
"REFEIÇÕES":["MEALS","COMIDAS","REPAS"],
"Todos os":["Every", "Todos los", "Tous les"],
"passos":["steps", "pasos", "pas"],
"ATEC PALMELA × FUNDAÇÃO GALP":["ATEC PALMELA × FUNDAÇÃO GALP", "ATEC PALMELA × FUNDAÇÃO GALP", "ATEC PALMELA × FUNDAÇÃO GALP"],
"16 — 22 NOV / MOVIMENTO SOLIDÁRIO":["16 — 22 NOV / SOLIDARITY IN MOTION", "16 — 22 NOV / MOVIMIENTO SOLIDARIO", "16 — 22 NOV / MOUVEMENT SOLIDAIRE"],
"UM PEQUENO GESTO.":["ONE SMALL GESTURE.", "UN PEQUEÑO GESTO.", "UN PETIT GESTE."],
"Um impacto":["An impact", "Un impacto", "Un impact"],
"maior.":["that matters.", "mayor.", "plus grand."],
"PASSOS → REFEIÇÕES":["STEPS → MEALS", "PASOS → COMIDAS", "PAS → REPAS"],
"A meta nacional do movimento":["The movement’s national goal","La meta nacional del movimiento","L’objectif national du mouvement"],
/* menu e cabeçalho */
"Desafio":["Challenge","Desafío","Défi"],
"Como funciona":["How it works","Cómo funciona","Comment ça marche"],
"Classificação":["Leaderboard","Clasificación","Classement"],
"Destaques":["Highlights","Destacados","À la une"],
"Login":["Login","Iniciar sesión","Connexion"],

/* página inicial */
"16 a 22 de novembro · Palmela":["November 16–22 · Palmela","16 al 22 de noviembre · Palmela","Du 16 au 22 novembre · Palmela"],
"Todos os passos":["Every step","Cada paso","Chaque pas"],
"contam.":["counts.","cuenta.","compte."],
"Uma semana de energia solidária: cada quilómetro dos formandos da ATEC Palmela vira refeições para quem mais precisa.":["A week of solidarity energy: every kilometre walked by ATEC Palmela students becomes meals for those who need them most.","Una semana de energía solidaria: cada kilómetro de los alumnos de ATEC Palmela se convierte en comidas para quienes más lo necesitan.","Une semaine d’énergie solidaire : chaque kilomètre parcouru par les élèves de l’ATEC Palmela devient des repas pour ceux qui en ont le plus besoin."],
"Como participar":["How to take part","Cómo participar","Comment participer"],
"Ver classificação →":["View leaderboard →","Ver clasificación →","Voir le classement →"],
"Ranking de turmas":["Class ranking","Ranking de clases","Classement des classes"],
"exemplo":["example","ejemplo","exemple"],
"Turma A":["Class A","Clase A","Classe A"],
"Turma B":["Class B","Clase B","Classe B"],
"Turma C":["Class C","Clase C","Classe C"],
"Turma D":["Class D","Clase D","Classe D"],
"Total ATEC Palmela":["ATEC Palmela total","Total ATEC Palmela","Total ATEC Palmela"],
"sobe a cada submissão":["goes up with every submission","sube con cada envío","augmente à chaque envoi"],
"dias para o primeiro passo":["days until the first step","días para el primer paso","jours avant le premier pas"],
"dia para o primeiro passo":["day until the first step","día para el primer paso","jour avant le premier pas"],
"dia da semana solidária":["day of the solidarity week","día de la semana solidaria","jour de la semaine solidaire"],

"Seguinte":["Next","Siguiente","Suivant"],
"Início":["Home","Inicio","Accueil"],
"A semana.":["The week.","La semana.","La semaine."],
"Sete dias, uma só equipa.":["Seven days, one team.","Siete días, un solo equipo.","Sept jours, une seule équipe."],
"Hoje":["Today","Hoy","Aujourd’hui"],
"Concluído":["Done","Completado","Terminé"],
"Em breve":["Soon","Pronto","Bientôt"],

/* rodapé */
"Vamos dar o nosso melhor passo.":["Let’s take our best step.","Demos nuestro mejor paso.","Faisons notre meilleur pas."],
"Bora!":["Let’s go!","¡Vamos!","Allons-y !"],
"16 a 22 de novembro":["November 16–22","16 al 22 de noviembre","Du 16 au 22 novembre"],
"ATEC Palmela · Todos os passos contam ·":["ATEC Palmela · Every step counts ·","ATEC Palmela · Cada paso cuenta ·","ATEC Palmela · Chaque pas compte ·"],
"Porque na ATEC Palmela acreditamos que o futuro se constrói com competência técnica, espírito de equipa e muita solidariedade. Iniciativa #TodosOsPassosContam, promovida pela Fundação Galp.":["Because at ATEC Palmela we believe the future is built with technical skill, team spirit and a lot of solidarity. #TodosOsPassosContam is an initiative promoted by Fundação Galp.","Porque en ATEC Palmela creemos que el futuro se construye con competencia técnica, espíritu de equipo y mucha solidaridad. Iniciativa #TodosOsPassosContam, promovida por la Fundación Galp.","Parce qu’à l’ATEC Palmela, nous croyons que l’avenir se construit avec compétence technique, esprit d’équipe et beaucoup de solidarité. Initiative #TodosOsPassosContam, promue par la Fondation Galp."],

/* classificação */
"Quem lidera a tabela?":["Who leads the table?","¿Quién lidera la tabla?","Qui est en tête du classement ?"],
"total acumulado pela ATEC Palmela":["total accumulated by ATEC Palmela","total acumulado por ATEC Palmela","total cumulé par l’ATEC Palmela"],
"Que equipa soma mais passos.":["Which team racks up the most steps.","Qué equipo suma más pasos.","Quelle équipe cumule le plus de pas."],
"Abre a 16 de novembro":["Opens on November 16","Abre el 16 de noviembre","Ouvre le 16 novembre"],
"Ranking de formandos":["Student ranking","Ranking de alumnos","Classement des élèves"],
"Quem deu mais passos em toda a ATEC.":["Who took the most steps across ATEC.","Quién dio más pasos en toda ATEC.","Qui a fait le plus de pas dans toute l’ATEC."],
"Dentro da equipa":["Within the team","Dentro del equipo","Au sein de l’équipe"],
"Em cada turma, quem andou mais.":["In each class, who walked the most.","En cada clase, quién caminó más.","Dans chaque classe, qui a le plus marché."],

/* como funciona */
"Como participar.":["How to take part.","Cómo participar.","Comment participer."],
"um grupo por turma":["one group per class","un grupo por clase","un groupe par classe"],
"Um grupo por turma no StepUp":["One group per class on StepUp","Un grupo por clase en StepUp","Un groupe par classe sur StepUp"],
"Cada turma cria o seu grupo na app para acompanhar os passos de todos, entre as aulas e nos tempos livres.":["Each class creates its own group in the app to follow everyone’s steps, between lessons and in free time.","Cada clase crea su grupo en la app para seguir los pasos de todos, entre clases y en los ratos libres.","Chaque classe crée son groupe dans l’appli pour suivre les pas de chacun, entre les cours et pendant les temps libres."],
"O delegado submete no fim do dia":["The class rep submits at the end of the day","El delegado envía al final del día","Le délégué soumet en fin de journée"],
"Soma o total do grupo, converte passos em quilómetros e submete aqui o resultado com o print.":["Add up the group’s total, convert steps into kilometres and submit the result here with the screenshot.","Suma el total del grupo, convierte los pasos en kilómetros y envía aquí el resultado con la captura.","Additionne le total du groupe, convertis les pas en kilomètres et soumets ici le résultat avec la capture d’écran."],
"Uma só equipa por Palmela":["One team for Palmela","Un solo equipo por Palmela","Une seule équipe pour Palmela"],
"Os dados de todos os delegados alimentam o contador geral, em tempo real.":["Data from all class reps feeds the overall counter, in real time.","Los datos de todos los delegados alimentan el contador general, en tiempo real.","Les données de tous les délégués alimentent le compteur général, en temps réel."],

/* desafio */
"Passos que viram refeições.":["Steps that become meals.","Pasos que se convierten en comidas.","Des pas qui deviennent des repas."],
"1,5M":["1.5M","1,5 M","1,5 M"],
"refeições para a Rede de Emergência Alimentar":["meals for the Food Emergency Network","comidas para la Red de Emergencia Alimentaria","repas pour le Réseau d’Urgence Alimentaire"],
"Estamos na reta final da iniciativa #TodosOsPassosContam, da Fundação Galp. A meta nacional: doar 1,5 milhões de refeições.":["We’re in the home stretch of Fundação Galp’s #TodosOsPassosContam initiative. The national goal: donate 1.5 million meals.","Estamos en la recta final de la iniciativa #TodosOsPassosContam, de la Fundación Galp. La meta nacional: donar 1,5 millones de comidas.","Nous sommes dans la dernière ligne droite de l’initiative #TodosOsPassosContam, de la Fondation Galp. L’objectif national : donner 1,5 million de repas."],
"Mostramos que a formação técnica e a responsabilidade social caminham lado a lado. Cada turma é uma equipa e todos os quilómetros contam para o mesmo total.":["We show that technical training and social responsibility go hand in hand. Each class is a team and every kilometre counts towards the same total.","Demostramos que la formación técnica y la responsabilidad social van de la mano. Cada clase es un equipo y todos los kilómetros cuentan para el mismo total.","Nous montrons que formation technique et responsabilité sociale vont de pair. Chaque classe est une équipe et chaque kilomètre compte pour le même total."],

/* destaques */
"Destaques do dia.":["Today’s highlights.","Destacados del día.","À la une aujourd’hui."],
"Turma Campeã do Dia":["Class of the Day","Clase Campeona del Día","Classe championne du jour"],
"A turma com mais quilómetros acumulados no dia anterior.":["The class with the most kilometres the previous day.","La clase con más kilómetros acumulados el día anterior.","La classe ayant cumulé le plus de kilomètres la veille."],
"Turma Revelação":["Breakout Class","Clase Revelación","Classe révélation"],
"A maior subida face ao seu próprio registo do dia anterior.":["The biggest improvement over its own previous-day record.","La mayor mejora respecto a su propio registro del día anterior.","La plus forte progression par rapport à son propre résultat de la veille."],
"Passada de Ouro":["Golden Stride","Zancada de Oro","Foulée d’Or"],
"O formando ou formanda com mais passos num só dia, com base nos prints.":["The student with the most steps in a single day, based on the screenshots.","El alumno o alumna con más pasos en un solo día, según las capturas.","L’élève avec le plus de pas en une seule journée, d’après les captures d’écran."],
"Espírito de Equipa":["Team Spirit","Espíritu de Equipo","Esprit d’équipe"],
"Turmas em que todos os elementos do grupo registaram atividade.":["Classes where every member of the group logged activity.","Clases en las que todos los miembros del grupo registraron actividad.","Classes dont tous les membres du groupe ont enregistré une activité."],

/* login / criar conta */
"Bem-vindo de volta.":["Welcome back.","Bienvenido de nuevo.","Bon retour."],
"Entra para submeter os km da tua turma.":["Sign in to submit your class’s km.","Entra para enviar los km de tu clase.","Connecte-toi pour soumettre les km de ta classe."],
"Email":["Email","Correo electrónico","E-mail"],
"Palavra-passe":["Password","Contraseña","Mot de passe"],
"Entrar":["Sign in","Entrar","Se connecter"],
"Ainda não tens conta?":["Don’t have an account yet?","¿Aún no tienes cuenta?","Pas encore de compte ?"],
"Criar conta":["Create account","Crear cuenta","Créer un compte"],
"Junta-te à equipa.":["Join the team.","Únete al equipo.","Rejoins l’équipe."],
"Cria a tua conta em menos de um minuto.":["Create your account in under a minute.","Crea tu cuenta en menos de un minuto.","Crée ton compte en moins d’une minute."],
"Nome":["Name","Nombre","Nom"],
"Turma":["Class","Clase","Classe"],
"Já tens conta?":["Already have an account?","¿Ya tienes cuenta?","Déjà un compte ?"],
"Fazer login":["Log in","Iniciar sesión","Se connecter"],
"nome@exemplo.pt":["name@example.com","nombre@ejemplo.com","nom@exemple.fr"],
"O teu nome":["Your name","Tu nombre","Ton nom"],
"Ex.: Turma A":["E.g. Class A","Ej.: Clase A","Ex. : Classe A"],
"Mínimo 8 caracteres":["At least 8 characters","Mínimo 8 caracteres","8 caractères minimum"],
"Verifica os campos assinalados.":["Check the highlighted fields.","Revisa los campos marcados.","Vérifie les champs signalés."],
"Login válido (falta ligar ao servidor).":["Valid login (server not connected yet).","Login válido (falta conectar con el servidor).","Connexion valide (serveur pas encore connecté)."],
"Conta criada (falta ligar ao servidor).":["Account created (server not connected yet).","Cuenta creada (falta conectar con el servidor).","Compte créé (serveur pas encore connecté)."],
"Código de acesso":["Access code","Código de acceso","Code d’accès"],
"Fornecido pela organização":["Provided by the organisers","Facilitado por la organización","Fourni par l’organisation"],
"Precisas do código de acesso da ATEC Palmela para criar conta.":["You need ATEC Palmela’s access code to create an account.","Necesitas el código de acceso de ATEC Palmela para crear una cuenta.","Il te faut le code d’accès de l’ATEC Palmela pour créer un compte."],
"Acesso restrito.":["Restricted access.","Acceso restringido.","Accès restreint."],
"Introduz o código de acesso da ATEC Palmela para continuar.":["Enter the ATEC Palmela access code to continue.","Introduce el código de acceso de ATEC Palmela para continuar.","Saisis le code d’accès de l’ATEC Palmela pour continuer."],
"Continuar":["Continue","Continuar","Continuer"],
"Código de acesso inválido.":["Invalid access code.","Código de acceso no válido.","Code d’accès invalide."],
"Demasiadas tentativas. Tenta novamente dentro de 1 minuto.":["Too many attempts. Try again in 1 minute.","Demasiados intentos. Vuelve a intentarlo en 1 minuto.","Trop de tentatives. Réessaie dans 1 minute."],
"Não foi possível validar o código. Tenta novamente.":["Couldn’t validate the code. Please try again.","No se pudo validar el código. Inténtalo de nuevo.","Impossible de valider le code. Réessaie."],
"Não foi possível ligar ao servidor.":["Couldn’t connect to the server.","No se pudo conectar con el servidor.","Impossible de se connecter au serveur."],
"Não foi possível concluir. Tenta novamente.":["Something went wrong. Please try again.","No se pudo completar. Inténtalo de nuevo.","Impossible de terminer. Réessaie."],
"Email ou palavra-passe incorretos.":["Incorrect email or password.","Correo o contraseña incorrectos.","E-mail ou mot de passe incorrect."],
"Confirma o teu email antes de entrar.":["Confirm your email before signing in.","Confirma tu correo antes de entrar.","Confirme ton e-mail avant de te connecter."],
"Já existe uma conta com este email.":["An account with this email already exists.","Ya existe una cuenta con este correo.","Un compte existe déjà avec cet e-mail."],
"Conta criada. Verifica o teu email para confirmar.":["Account created. Check your email to confirm.","Cuenta creada. Revisa tu correo para confirmar.","Compte créé. Vérifie ton e-mail pour confirmer."],
"Conta criada com sucesso.":["Account created successfully.","Cuenta creada con éxito.","Compte créé avec succès."],
"Sessão iniciada.":["Signed in.","Sesión iniciada.","Connexion réussie."],

/* submeter pontuação */
"Submeter":["Submit","Enviar","Soumettre"],
"Olá,":["Hi,","Hola,","Salut,"],
"Terminar sessão":["Sign out","Cerrar sesión","Se déconnecter"],
"Entra para submeter.":["Sign in to submit.","Entra para enviar.","Connecte-toi pour soumettre."],
"Precisas de ter sessão iniciada para enviar a pontuação da tua turma.":["You need to be signed in to send your class’s score.","Necesitas haber iniciado sesión para enviar la puntuación de tu clase.","Tu dois être connecté pour envoyer le score de ta classe."],
"Iniciar sessão":["Sign in","Iniciar sesión","Se connecter"],
"Submete a pontuação.":["Submit your score.","Envía la puntuación.","Soumets le score."],
"Carrega o print do StepUp com os passos da tua turma e indica os quilómetros.":["Upload the StepUp screenshot with your class’s steps and enter the kilometres.","Sube la captura de StepUp con los pasos de tu clase e indica los kilómetros.","Charge la capture StepUp avec les pas de ta classe et indique les kilomètres."],
"Dia":["Day","Día","Jour"],
"Quilómetros":["Kilometres","Kilómetros","Kilomètres"],
"Ex.: 12,5":["E.g. 12.5","Ej.: 12,5","Ex. : 12,5"],
"Prints da pontuação":["Score screenshots","Capturas de la puntuación","Captures du score"],
"Arrasta os prints para aqui":["Drag your screenshots here","Arrastra las capturas aquí","Glisse tes captures ici"],
"ou clica para escolher · também podes colar com Ctrl+V":["or click to choose · you can also paste with Ctrl+V","o haz clic para elegir · también puedes pegar con Ctrl+V","ou clique pour choisir · tu peux aussi coller avec Ctrl+V"],
"PNG, JPG ou WebP · até 8 MB cada · máximo 2":["PNG, JPG or WebP · up to 8 MB each · max 2","PNG, JPG o WebP · hasta 8 MB cada una · máximo 2","PNG, JPG ou WebP · 8 Mo max. chacune · 2 maximum"],
"Enviar pontuação":["Send score","Enviar puntuación","Envoyer le score"],
"Remover":["Remove","Quitar","Retirer"],
"Escolhe pelo menos um print.":["Choose at least one screenshot.","Elige al menos una captura.","Choisis au moins une capture."],
"Ficheiro inválido. Usa PNG, JPG ou WebP até 8 MB.":["Invalid file. Use PNG, JPG or WebP up to 8 MB.","Archivo no válido. Usa PNG, JPG o WebP de hasta 8 MB.","Fichier invalide. Utilise PNG, JPG ou WebP jusqu’à 8 Mo."],
"Podes enviar no máximo 2 prints.":["You can send at most 2 screenshots.","Puedes enviar como máximo 2 capturas.","Tu peux envoyer 2 captures au maximum."],
"A enviar…":["Sending…","Enviando…","Envoi…"],
"Pontuação enviada. Obrigado!":["Score sent. Thank you!","Puntuación enviada. ¡Gracias!","Score envoyé. Merci !"],
"Não foi possível enviar. Tenta novamente.":["Couldn’t send. Please try again.","No se pudo enviar. Inténtalo de nuevo.","Envoi impossible. Réessaie."],
"A verificar os prints…":["Checking the screenshots…","Comprobando las capturas…","Vérification des captures…"],
"Formandos lidos:":["Trainees read:","Alumnos leídos:","Stagiaires lus :"],
"Total da turma:":["Class total:","Total de la clase:","Total de la classe :"],
"Foto":["Photo","Foto","Photo"],
"é de outra app, não do StepUp.":["is from another app, not StepUp.","es de otra app, no de StepUp.","vient d’une autre app, pas de StepUp."],
"não é um print do StepUp.":["is not a StepUp screenshot.","no es una captura de StepUp.","n’est pas une capture StepUp."],
"não dá para ler. Tira um print mais nítido.":["can’t be read. Take a clearer screenshot.","no se puede leer. Haz una captura más nítida.","illisible. Fais une capture plus nette."],
"Não foi possível ler os prints. Tenta novamente.":["Couldn’t read the screenshots. Please try again.","No se pudieron leer las capturas. Inténtalo de nuevo.","Lecture des captures impossible. Réessaie."],

/* rankings */
"Ver ranking":["View ranking","Ver ranking","Voir le classement"],
"Ver turmas":["View classes","Ver clases","Voir les classes"],
"Os passos de cada turma na semana de 16 a 22 de novembro.":["Each class’s steps in the week of 16 to 22 November.","Los pasos de cada clase en la semana del 16 al 22 de noviembre.","Les pas de chaque classe pendant la semaine du 16 au 22 novembre."],
"Passos por turma":["Steps per class","Pasos por clase","Pas par classe"],
"turmas em competição":["classes competing","clases en competición","classes en compétition"],
"formandos a caminhar":["students walking","alumnos caminando","élèves en marche"],
"Passos":["Steps","Pasos","Pas"],
"Distância":["Distance","Distancia","Distance"],
"Escolhe uma turma para ver quem andou mais.":["Pick a class to see who walked the most.","Elige una clase para ver quién caminó más.","Choisis une classe pour voir qui a le plus marché."],
"turmas":["classes","clases","classes"],
"formandos":["students","alumnos","élèves"],
"formando":["student","alumno","élève"],
"Todas as turmas":["All classes","Todas las clases","Toutes les classes"],
"Quem andou mais nesta turma, de 16 a 22 de novembro.":["Who walked the most in this class, from 16 to 22 November.","Quién caminó más en esta clase, del 16 al 22 de noviembre.","Qui a le plus marché dans cette classe, du 16 au 22 novembre."],
"total da turma":["class total","total de la clase","total de la classe"],
"Turma não encontrada.":["Class not found.","Clase no encontrada.","Classe introuvable."],
"Ainda não há dados.":["No data yet.","Aún no hay datos.","Pas encore de données."],
"A carregar…":["Loading…","Cargando…","Chargement…"],
"Não foi possível carregar os dados.":["Couldn’t load the data.","No se pudieron cargar los datos.","Impossible de charger les données."]
};

var lang="en"; /* idioma por defeito: inglês (a escolha do utilizador fica guardada) */
try{var sv=localStorage.getItem("lang");if(sv&&NAMES[sv])lang=sv}catch(e){}

var textOrig=new WeakMap(),attrOrig=new WeakMap(),title0=document.title;
function tr(s,l){if(l==="pt")return s;var e=D[s];return e?e[IDX[l]]:s}
/* usado também pelo main.js para textos criados por JavaScript */
window.t=function(s){return tr(s,lang)};

function q(s){return [].slice.call(document.querySelectorAll(s))}

function translate(){
  var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null),n,list=[];
  while(n=w.nextNode()){var p=n.parentNode.nodeName;if(p!=="SCRIPT"&&p!=="STYLE")list.push(n)}
  list.forEach(function(n){
    var raw=textOrig.has(n)?textOrig.get(n):n.nodeValue,k=raw.trim();
    if(!k||!D[k])return;
    textOrig.set(n,raw);
    n.nodeValue=lang==="pt"?raw:raw.match(/^\s*/)[0]+tr(k,lang)+raw.match(/\s*$/)[0];
  });
  q("[placeholder]").forEach(function(el){
    var o=attrOrig.get(el);if(o===undefined){o=el.getAttribute("placeholder");attrOrig.set(el,o)}
    el.setAttribute("placeholder",tr(o,lang));
  });
  document.title=title0.split(" · ").map(function(p){return tr(p,lang)}).join(" · ");
  document.documentElement.lang=HTML[lang];
}

/* seletor no cabeçalho */
var hd=document.getElementById("hd"),wrap=document.createElement("div"),btn,menu;
wrap.className="lang";
wrap.innerHTML='<button type="button" class="lang-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Language"><span class="flag"></span><svg class="car" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><path d="M1 1l5 6 5-6z" fill="currentColor"/></svg></button><ul class="lang-menu" role="listbox"></ul>';
btn=wrap.querySelector(".lang-btn");menu=wrap.querySelector(".lang-menu");
ORDER.forEach(function(l){
  var li=document.createElement("li");
  li.innerHTML='<button type="button" role="option" data-l="'+l+'"><span class="flag">'+FL[l]+'</span>'+NAMES[l]+'</button>';
  menu.appendChild(li);
});
if(hd)hd.insertBefore(wrap,hd.querySelector(".btn")||null);

function toggle(open){menu.classList.toggle("open",open);btn.setAttribute("aria-expanded",open)}
btn.addEventListener("click",function(e){e.stopPropagation();toggle(!menu.classList.contains("open"))});
document.addEventListener("click",function(){toggle(false)});
document.addEventListener("keydown",function(e){if(e.key==="Escape")toggle(false)});
menu.addEventListener("click",function(e){
  var b=e.target.closest("button[data-l]");if(!b)return;
  lang=b.dataset.l;try{localStorage.setItem("lang",lang)}catch(x){}
  toggle(false);apply();
  window.dispatchEvent(new Event("langchange"));
});

function apply(){
  q(".msg").forEach(function(m){m.textContent=""});
  translate();
  btn.querySelector(".flag").innerHTML=FL[lang];
  q(".lang-menu button").forEach(function(b){b.setAttribute("aria-selected",b.dataset.l===lang)});
}
apply();
})();
