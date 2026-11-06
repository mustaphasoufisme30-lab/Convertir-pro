import React from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Tablet, 
  CheckCircle2, 
  Smartphone, 
  Send, 
  UploadCloud, 
  Sparkles,
  Book,
  AlertTriangle,
  Check,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface EducationalGuideProps {
  lang: 'fr' | 'en';
}

export const EducationalGuide: React.FC<EducationalGuideProps> = ({ lang }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* TROUBLESHOOTING CARD: Résoudre l'erreur de fichier endommagé sur Amazon KDP */}
      <div className="bg-gradient-to-br from-amber-950/60 via-neutral-900 to-amber-950/30 border-2 border-amber-500/60 rounded-2xl p-6 sm:p-7 space-y-4 shadow-2xl shadow-amber-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-neutral-100 flex items-center gap-2">
              <span>{lang === 'fr' ? "Résoudre l'erreur « Fichier endommagé » sur Amazon KDP" : "Fixing 'Damaged File' Error on Amazon KDP"}</span>
              <span className="text-[10px] bg-amber-500/30 text-amber-200 border border-amber-400/50 px-2 py-0.5 rounded font-bold uppercase">
                Important
              </span>
            </h3>
            <p className="text-xs text-amber-300/80">
              {lang === 'fr' 
                ? 'Explication officielle et solution garantie en 1 clic' 
                : 'Official explanation and 1-click guaranteed solution'}
            </p>
          </div>
        </div>

        <div className="bg-neutral-950/70 rounded-xl p-4 sm:p-5 border border-amber-500/20 space-y-3 text-xs text-neutral-300 leading-relaxed">
          <p>
            <strong className="text-amber-300 font-semibold">Pourquoi Amazon KDP refuse-t-il les fichiers avec l'extension .KPF ?</strong>
            <br />
            Amazon a conçu l'extension <code className="text-amber-300 bg-neutral-900 px-1 py-0.5 rounded font-mono">.kpf</code> exclusivement pour son logiciel fermé <em>Kindle Create</em>. Lors de l'import d'un fichier .kpf, le serveur d'Amazon KDP recherche des signatures binaires propriétaires. S'il ne les trouve pas, il affiche par erreur le message : <span className="text-rose-400 font-bold">« Le fichier est endommagé ou non valide »</span>.
          </p>

          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'fr' ? 'La Solution Officielle Recommandée par Amazon :' : 'Official Amazon Solution:'}</span>
            </div>
            <p className="text-neutral-200 leading-relaxed">
              Pour publier sur <strong>Kindle Direct Publishing (KDP)</strong>, Amazon recommande officiellement le format <strong>.EPUB (EPUB 3)</strong>.
              Notre convertisseur génère un livre <strong>Amazon KDP (.epub)</strong> 100% conforme avec navigation NCX/NAV, métadonnées Dublin Core et typographie Bookerly.
              Amazon KDP l'accepte instantanément et le convertit automatiquement pour toutes les liseuses Kindle sans aucune erreur !
            </p>
          </div>

          {/* Step-by-step KDP upload guide */}
          <div className="space-y-2 pt-1">
            <strong className="text-neutral-200 font-semibold block">
              {lang === 'fr' ? 'Comment publier votre livre sur Amazon KDP en 4 étapes :' : 'How to publish on Amazon KDP in 4 steps:'}
            </strong>
            <ol className="space-y-1.5 list-decimal list-inside text-neutral-400">
              <li>
                Dans notre convertisseur, cliquez sur le bouton doré <strong>« Télécharger pour Amazon KDP (.epub) »</strong>.
              </li>
              <li>
                Rendez-vous sur votre compte <strong>kdp.amazon.com</strong> et créez un <em>« Livre électronique Kindle »</em>.
              </li>
              <li>
                À l’onglet <strong>« Contenu du livre électronique Kindle »</strong>, sous la section <strong>« Manuscrit »</strong>, cliquez sur <strong>« Charger le manuscrit du livre électronique »</strong> et sélectionnez le fichier <code className="text-amber-300 bg-neutral-900 px-1 py-0.5 rounded font-mono">.epub</code>.
              </li>
              <li>
                Amazon KDP traite le fichier en quelques secondes et affiche : <span className="text-emerald-400 font-semibold">« Téléversement réussi ! »</span>. Vous pouvez ensuite cliquer sur <strong>« Ouvrir le prévisualisateur »</strong> pour admirer votre livre !
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Hero explanation card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 text-cyan-400">
          <Book className="w-6 h-6 text-amber-400" />
          <h3 className="text-lg font-bold text-neutral-100">
            {lang === 'fr' 
              ? 'Guide Technique : Formats Amazon Kindle KPF & EPUB' 
              : 'Technical Guide: Amazon Kindle KPF & EPUB Formats'}
          </h3>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed">
          {lang === 'fr'
            ? 'Le convertisseur Mahfoud Mustapha transforme les documents PDF statiques en véritables livres numériques reflowable (texte redimensionnable) optimisés pour la typographie Bookerly et l’écosystème Amazon Kindle.'
            : 'The Mahfoud Mustapha converter transforms static PDF documents into reflowable digital books optimized for Bookerly typography and the Amazon Kindle ecosystem.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* What is a PDF */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>1. Le format PDF (Pages fixes)</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Le PDF fige la mise en page sous forme de pages statiques. Sur un smartphone ou une liseuse à encre électronique, lire un PDF impose de zoomer continuellement, rendant la lecture fatigante.
            </p>
          </div>

          {/* What is KPF / EPUB */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Tablet className="w-4 h-4" />
              <span>2. Le format KDP / Kindle</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Le format <strong>KDP / Kindle</strong> transforme le document en texte fluide et dynamique (« reflowable text »). Il adapte la taille des polices (Bookerly), supporte le mode sombre/nuit et offre un confort de lecture optimal.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Methods to Read and Transfer your Book */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl">
        <h4 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          <span>{lang === 'fr' ? 'Comment lire et transférer votre livre ?' : 'How to read and transfer your book?'}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Method 1: Mobile App */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <strong className="text-neutral-100 text-sm block">1. Sur Smartphone (iOS & Android)</strong>
              <p className="text-neutral-400 leading-relaxed">
                Téléchargez gratuitement l’application officielle <strong>Amazon Kindle</strong> ou <strong>Apple Livres</strong>. Ouvrez le fichier téléchargé pour commencer votre lecture instantanément.
              </p>
            </div>
          </div>

          {/* Method 2: Send to Kindle / E-readers */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Send className="w-5 h-5" />
              </div>
              <strong className="text-neutral-100 text-sm block">2. Liseuses Kindle (Paperwhite, Scribe, Oasis)</strong>
              <p className="text-neutral-400 leading-relaxed">
                Utilisez le service <em>Send to Kindle</em> d’Amazon : envoyez votre fichier en pièce jointe à votre adresse email personnalisée <code>@kindle.com</code> ou utilisez la page web amazon.com/sendtokindle.
              </p>
            </div>
          </div>

          {/* Method 3: Amazon KDP Publishing */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <strong className="text-neutral-100 text-sm block">3. Amazon KDP (Publication & Vente)</strong>
              <p className="text-neutral-400 leading-relaxed">
                Le fichier <strong>.epub (Amazon KDP Ready)</strong> est immédiatement accepté sur le portail <strong>Kindle Direct Publishing</strong> pour commercialiser votre livre sur Amazon dans le monde entier.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Technical features produced by Mahfoud Mustapha Converter */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
        <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{lang === 'fr' ? 'Spécifications techniques du livre généré' : 'Technical specifications of generated book'}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-200">Typographie Bookerly & Amazon Ember :</strong>
              <p className="text-neutral-400 mt-0.5">Polices typographiques lissées avec césures automatiques et lettrines de premier paragraphe.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-200">Double table des matières NCX & NAV :</strong>
              <p className="text-neutral-400 mt-0.5">Supporte à la fois les liseuses Kindle historiques (NCX) et les spécifications modernes EPUB 3 (NAV).</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-200">Métadonnées Dublin Core complètes :</strong>
              <p className="text-neutral-400 mt-0.5">Auteur, titre, éditeur, identifiant unique URN et horodatage ISO conformes aux exigences d'Amazon.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-200">Modes Nuit, Sépia & Contrasté :</strong>
              <p className="text-neutral-400 mt-0.5">Feuille de style CSS adaptative s'ajustant aux réglages d'éclairage de votre écran ou liseuse.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
