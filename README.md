# KronoBabylon

Ouvrir `index.html` pour jouer localement. Le mode hors ligne installe necessite
un serveur HTTP local ou un hebergement HTTPS et une premiere visite connectee.

## Images partagees

`image-assets.js` associe chaque chemin logique a une image existante. Les fichiers
de meme nom mais de contenus differents restent distincts. L'outil de deduplication
n'effectue aucune conversion : seuls les contenus identiques octet par octet sont
regroupes, apres classement par SHA-256.

Apres ajout ou remplacement d'images, avec Node.js :

```sh
node scripts/deduplicate-images.cjs --check
node scripts/deduplicate-images.cjs --apply
```

La premiere commande simule sans modifier les fichiers. La seconde regenere la
table des chemins avant de supprimer les copies strictement identiques.
Pour modifier une image propre a un scenario, ajouter le fichier sous son chemin
logique d'origine puis relancer l'outil ; ne pas modifier directement une image
partagee sans vouloir changer tous les scenarios qui l'utilisent.

Apres une modification des ressources publiees, incrementer `CACHE_NAME` dans
`sw.js` pour renouveler le cache. Celui-ci contient une seule copie de chaque image.

## Compression

Les images opaques ont ete converties en WebP qualite 90, sans redimensionnement,
uniquement lorsque le resultat etait plus petit. Elles sont stockees sous
`images/optimized/`, avec un nom derive du SHA-256 du contenu. Les chemins logiques
des scenarios restent inchanges grace a `image-assets.js`.

Les 13 images transparentes sont conservees sans aucune modification. Les icones
d'installation restent en PNG. Eviter de recompresser les WebP optimises : pour
une nouvelle conversion, repartir des images sources originales.
