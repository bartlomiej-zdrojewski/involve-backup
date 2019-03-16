# involve
Krótka instrukcja obsługi:
Wszystko poza /public to pliki serwera. Zostawcie je w spokoju.

Jak wrzucacie nowy ekran to zróbcie na niego folder i wrzućcie do /public/temp,
serwerowa wróżka je ładnie porozkłada do aktualnych arkuszy itd.

Peace.

## Stawianie serwera lokalnie (linux)
### Wymagane programy
* [node.js](https://nodejs.org/en/download/package-manager/)
* [mongoDB](https://docs.mongodb.com/manual/administration/install-on-linux/)
### Uruchomienie
* Dodaj plik _.env_ do głównego katalogu (o jego treść poproś kogoś z projektu).
* Zainstaluj pakiety, uruchamiając ```npm install``` w głównym folderze.
* Uruchom mongo w terminalu wpisując polecenie ```mongod```.
* Uruchom serwer wpisując ```node app.js``` w głównym folderze.

Po wykonaniu tych kroków strona główna będzie dostępna pod [http:localhost:3000/static](http:localhost:3000/static)

## Dokumentacja i protokół
Do protokołu i związanej z nim dokumentacji korzystamy ze [swaggera](https://swagger.io/).

### Podgląd i edycja
#### _przy uruchomionym serwerze_
* podgląd: [/docs](http://localhost:3000/docs)
* edycja: [/docs/edit](http://localhost:3000/docs/edit)
#### _bez uruchomionego serweru_
* ~~podgląd~~
* edycja:
otwórz w przeglądarce plik
_protocol/swagger/edti/index.html_
### Quick start
Poniżej przedstawiam mini-dokumentację jak należy poisywać ścieżki swaggera.
#### Struktura każdej ze ścieżek
Wszystkie ścieżki znajdują się w obiekcie "paths", a każda z nich wygląda nasępująco:
```json
"/scieżka/do/zasobu": {
  "protocol": { //możliwe opcje: "get", "post", "add", "update", "delete"
    "summary": "opis ścieżki",
    "consumes": [ // opcjonalna, zwykle jednoelementowa tablica opisująca format inputu; poniższe typy są używane na naszej stronie
      "application/json",   // json
      "multipart/form-data" // html form
    ],
    "produces": [ // j.w.; opisuje response
      "application/json"
    ],
    "tags": [ // tablica tagów ścieżki - pojawi się ona pod wszystkimi tagami
      "tag1"
    ],
    "parameters": [],  //tablica zawierająca opis input-u [patrz niżej]
    "responses": {  //obiekt zawierający odpowiedzi uszeregowane kodami
      "200": { 
        "description": "OK" // UWAGA - obowiązkowy element odpowiedzi
      },
      "401": {
        "description": "Brak uprawnień"
      }
    }
  }
}
```
#### Opisywanie elementów
Każdy element w swaggerze posiada obowiązkowe pola: `type` i `name`,
oraz szereg opcjonalnych pól, w tym w szczególności: `description`, `format` i `enum` _(będący tablicą dozwolonych wartości)_.

##### Podstawowe typy:  
* `string`, używane przez nas formaty:
    * `date`
    * `user_id`
    * `skill_code`
    * `hash`
    * `path`
* `integer`
* `boolane`
##### Typy złożone:
* `array`  
 Używana do opisu tablicy elementów. Typu zawartości reprezentuje obiekt `items`  
  **_Na przykład:_**
    ```json
    {  
      "type": "array",
      "description": "Tablica ścieżek",
      "items": {
        "type": "string",
        "format": "path"
      }
    }
    ```
* `object`  
 Używana do opisu obiektu. Zawartość opisana jest w obiekcie `parameters` w formacie `nazwa_pola: obiekt_opisujący_zawartość`.  
 Nazwy wymaganych pól zawarte są w tablicy `required`.  
  **_Na przykład:_**
    ```json
    {  
      "type": "object",
      "required": [
        "userName",
        "skills"
      ],
      "properties": {
        "userName": {
          "type": "string"
        },
        "sex": {
          "type": "string",
          "enum": [
            "Kobieta",
            "Mężczyzna",
            "Inna"
          ]
        },
        "skills": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": {
                "type": "string"
              },
              "level": {
                "type": "integer"
              }
            }
          }
        } 
      }
    }
    ```    
#### Input
Cały opis inputu znajduje się w tablicy `parameters`.  
Każdy elemen to obiekt, który musi zawierać pole `in`, `name` oraz `type` lub `shema`.
#####1. in query _(np.: /project?hash=hash)_
Każdy parametr jest osobnym obiektem.  
Parametry powinny być **wyłączone** ze ścieżki!  
**_Przykład:_**
```json 
"/project": {
  "get": {
    "parameters": [{
        "in": "query",
        "name": "hash",
        "type": "string"
     }]
  }
}
```
#####2. in path _(np.: /project/:hash/team)_
Każdy parametr jest osobnym obiektem.  
Nazwy parametrów powinny być ujęte w **nawias klamrowy**.  
**_Przykład:_**
```json 
"/project/{hash}/team": {
  "get": {
    "parameters": [{
        "in": "path",
        "name": "hash",
        "type": "string"
     }]
  }
}
```
#####3. in **formData** _(html form)_
Każdy parametr jest osobnym obiektem.  
**_Przykład:_**
```json 
"/project/apply": {
  "post": {
    "consumes": [
        "application/x-www-form-urlencoded"
    ]
    "parameters": [{
        "in": "formData",
        "name": "reason",
        "type": "string"
    },{
        "in": "formData",
        "name": "propositions",
        "type": "string"
    }]
  }
}
```
#####4. in **body** _(html form)_
Wszystkie parametr ujęte są w **jeden obiekt**, nazwany jedynie w celach dokumetacji _(jest to inaczej nazwane body)_.  
Pole `name` mus być **unikalne**.
Zamiast pola `type` musi zostać użyte pole `schema`  
**_Przykład:_**
```json 
"/project/apply": {
  "post": {
    "consumes": [
        "application/json"
    ]
    "parameters": [{
        "name": "project_application"
        "in": "body",
        "shema": {
            "type": "object",
            "parameters": {
                "reason": {
                    "type": "string"
                },
                "propositions": {
                    "type": "string"
                }
            }
        }
    }]
  }
}
```
#### Output
Obiekty przesyłane w odpowiedzi definiowane są identycznie jak w body (z tą różnicą, że nie wymagają sztucznie tworzonej nazwy).  
**_Przykład:_**
```json 
"/project/initialMessage": {
  "get": {
    "produces": [
        "application/json"
    ]
    "parameters": [],
    "responses": {
        "200": {
            "description": "Przesyła wiadmość",
            "schema": {
                "type": "object',
                "properties": {
                    "header": {
                        "type": "string"
                    },
                    "message": {
                        "type": "string",
                    }
                }
            }
        }
    }
  }
}
```
### ToDo: dodanie do protokołu dokumentów
Można się do nich odwoływać za pomocą `$ref` zamiast po raz n-ty opisywać obiekt np. projektu (problemem jest to, że zwykle nasze ścieżki różnią się delikatnie zawartością).
### Przydatne linki:
* [specyfikacja opisu ścieżek](https://swagger.io/docs/specification/what-is-swagger/)
* [specyfikacja konkretnych obiektów](https://swagger.io/specification/)
* [repozytorium swagger ui](https://github.com/swagger-api/swagger-ui)
* [repozytorium swagger editor](https://github.com/swagger-api/swagger-editor)