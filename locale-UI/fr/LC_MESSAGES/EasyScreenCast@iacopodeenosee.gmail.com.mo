��    *      l  ;   �      �     �     �     �     �     �     	          3     M     g     �     �     �     �     �     �     �     
     &  )   3     ]     t     �     �  �   �     Z  %   o  )   �     �  E  �        '   ;  �   c  �   7	  �    
  <   �
      �
     �
     �
     �
  ~   �
  �  v                    *     G     W      q      �     �     �      �  .        3     J     ]     j     r      �     �  6   �  !   �  !        *     B  �   ]       !     C   ;       �  �  #        C  �   b  �   R  �   B  ?   �     6     H     P     R  �   T                      #         
                 *            %      (   '   "                    !       $                              )       	                                            &                  0 <b>File screencast</b> <b>Screencast area</b> <b>Screencast options</b> Area of screencast :  Choose a directory Command post-recording Custom GStreamer Pipeline Draw cursor on screencast Enable keyboard shortcut Enable verbose debug Execute command after recording File name template :  Frames Per Second Full screen area Height   Input source Audio Maximum duration screencast Official doc Replace standard indicator on status menu Restore default option Select specific area Select specific desktop Select specific window Select the folder where the file is saved, if not specific a folder  the file will be saved in the $XDG_VIDEOS_DIR if it exists, or the home directory otherwise. Shortcut combination Show area screencast during recording Show time recording into notification bar Specific screen area The extension handles audio and webcam support  only if is NOT used a custom gstreamer pipeline .
GStreamer is a pipeline-based multimedia allows a programmer to create a variety of media-handling components, including simple audio playback, audio and video playback, recording, streaming and editing.Below some useful links. The file is saved in the path :  The registration covers the entire area This option enable more debug message, to view these run this command into a terminal:
$ journalctl /usr/bin/gnome-session --since=today --no-pager | grep js
$ dbus-monitor "interface=org.gnome.Shell.Screencast" This option enable more debug message, to view these run this command into a terminal:
$ journalctl /usr/bin/gnome-session --since=today | grep js
$ dbus-monitor "interface=org.gnome.Shell.Screencast" This option not work in gnome shell 3.10 because the limit of 30 seconds is hardcoded:
https://bugzilla.gnome.org/show_bug.cgi?id=708660 To activate the change of the shortcut restart the extension Values ​​expressed in pixels Width   X   Y   the filename which may contain some escape sequences - %d and %t will be replaced by the start date and time of the recording. Project-Id-Version: 1
Report-Msgid-Bugs-To: 
POT-Creation-Date: 2013-11-02 15:38+0100
PO-Revision-Date: 2015-09-06 21:28+0200
Last-Translator: maboiteaspam <https://github.com/maboiteaspam>
Language-Team: français <>
Language: fr
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit
X-Generator: Gtranslator 2.91.6
Plural-Forms: nplurals=2; plural=(n > 1);
 0 Fichier vidéo <b>Aire de capture</b> <b>Options du screencast</b> Aire de capture Choisissez un répertoire Commandes de post-enregistrement Pipeline GStreamer personnalisé Capturer le curseur Activer le racourci clavier Augmenter le niveau de débogage Exécuter une commande après l'enregistrement Nom du fichier modèle Images par seconde Plein écran Hauteur Entrée audio Durée d'enregistrement maximale Documentation Remplacer l'indicateur standard dans le menu de statut Restaurer les options par défaut Sélectionner une zone de capture Sélectionner un bureau Sélectionner une fenêtre Sélectionner le répertoire ou le fichier doit être enregistré, si non spécifié le fichier sera enregistré sous $XDG_VIDEOS_DIR s'il existe, sinon dans votre home. Raccourci clavier Afficher la zone d'enregistrement Afficher le compteur d'enregistrement dans la barre de notification Personnalisé Cette extension supporte ne prend en charge votre webcam et son audio que si vous n'utilisez pas un pipeline  gstreamer personnalié.
GStreamer est un cadriciel basé sur les pipelines pour permettre au prgrammeur de créer de mutiples composants multimédia, lecture audio, lecture audio et vidéo enregistrement, émission de flux vidéo et édition. Vous trouverez ci-dessous quelques liens utiles. Le fichier sera enregistré dans :  Capture de l'écran au complet Cette option permet d'augmenter le niveau de débogage, pour voir les logs lancer cette commande dans un terminal:
$ journalctl /usr/bin/gnome-session --since=today --no-pager | grep js
$ dbus-monitor "interface=org.gnome.Shell.Screencast" Cette option permet d'augmenter le niveau de débogage, pour voir les logs lancer cette commande dans un terminal:
$ journalctl /usr/bin/gnome-session --since=today --no-pager | grep js
$ dbus-monitor "interface=org.gnome.Shell.Screencast" Cette otion ne fonctionne pas avec gnome shell 3.10, car la limite de 30 secondesest écrite en dure, veuillez vous reporter vers:https://bugzilla.gnome.org/show_bug.cgi?id=708660 Redémarrer l'extension pour activer le changement de raccourci Valeurs en pixels Largeur X Y Le nom du fichier peut contenir des caractères spéciaux, %d et %t seront respectivement remplacés par la date de début d'enregistrement et la durée. 