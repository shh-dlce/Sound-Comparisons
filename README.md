Sound Comparisons
===

## Exploring Diversity in Phonetics across Language Families


Welcome to Sound Comparisons, a website structure for exploring diversity in phonetics across language families from around the world.  

We already cover hundreds of regional languages, dialects and accents across various language families:

* in Europe:  the [Romance](https://soundcomparisons.com/#/en/Romance/map//Lgs_Sln), [Germanic](https://soundcomparisons.com/#/en/Germanic/map//Lgs_Sln), [Balto-Slavic](https://soundcomparisons.com/#/en/Slavic/map//Lgs_Sln) and [Celtic](https://soundcomparisons.com/#/en/Celtic/map//Lgs_Sln) families, and [accents of English](https://soundcomparisons.com/#/en/Englishes/map//Lgs_Sln)
* in the Andes:  the [Quechua, Aymara, Uru](https://soundcomparisons.com/#/en/Andean/map//Lgs_Sln) and [Mapudungun](https://soundcomparisons.com/#/en/Mapudungun/map//Lgs_Sln) families
* in Vanuatu:  the Austronesian languages of [Vanuatu](https://soundcomparisons.com/#/en/Vanuatu/map//Lgs_Sln), the ‘Galapagos of language evolution’ 

Just hover the mouse over any map or table view to hear instantaneously the different pronunciations of the same 100-250 words [‘cognate’] across that family, recorded in our fieldwork campaigns.

These databases serve as input to linguistic research to measure how phonetic divergence arose through the histories of these language families (see Heggarty et al. 2010).  

Our website offers powerful tools for linguist researchers (to search and filter the database, download all detailed phonetic transcriptions and sound files, create citable links, etc.), but is also multilingual and user-friendly for the general public who actually speak all of these languages, many of them endangered.


Requirements:
===

`php-fpm` installed via `apt`, see https://www.digitalocean.com/community/tutorials/how-to-install-linux-nginx-mysql-php-lemp-stack-in-ubuntu-16-04#step-3-install-php-for-processing


Setup instructions:
===

* Sound files must be uploaded by using the Python app [soundcomparisons](https://github.com/clld/soundcomparisons-data).
* Configuration is done via environment variables.
These can be set in `/etc/php/7.0/fpm/pool.d/www.conf`:
```shell
env[DEPLOYED] = 'true'
env[MYSQL_SERVER] = 'localhost'
env[MYSQL_USER] = 'soundcomparisons'
env[MYSQL_PASSWORD] = '…'
env[MYSQL_DATABASE] = 'v4'
```
* A soundcomparisons user was created to run the systemd scripts as:
```shell
useradd -M soundcomparisons  # -M: no homedirectory created
usermod -L soundcomparisons  # -L: no login allowed for user
chown -R soundcomparisons.soundcomparisons /srv/soundcomparisons
```

Offline version:
===

An offline version can be created by using the Python app [soundcomparisons](https://github.com/clld/soundcomparisons-data).
