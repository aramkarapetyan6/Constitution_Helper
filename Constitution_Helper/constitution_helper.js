import fs from 'fs';
import natural from 'natural';

const [,, method, searchText] = process.argv;

if (method !== 'find' || !searchText) {
    console.error("Usage: ./constitution_helper.js find \"searchText\"");
    process.exit(1);
}

fs.readFile("./Constitution.txt", "utf-8", (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    const wordnet = new natural.WordNet();

    function findSynonyms(word) {
        return new Promise((resolve, reject) => {
            wordnet.lookup(word, (results) => { 
                resolve(results);
            });
        });
    }

    function find(words, splitText) {
        if (!Array.isArray(words)) {
            words = words.split(", ");
        }
        console.log(words)
        return Promise.all(words.map(word => {
            return findSynonyms(word)
                .then(results => {
                    const synonyms = results.map(result => result.synonyms).flat();
                    for (let o in splitText) {
                        for (let i = 0; i < splitText[o].length; i++) {
                            for (let j = 0; j < splitText[o][i].length; j++) {
                                for (let s in synonyms) {
                                    if (splitText[o][i][j].join(' ').toLowerCase().includes(synonyms[s].toLowerCase())) {
                                        console.log('=====', splitText[o][i][j].join(' ').replace(/ ,/g, ',').replace(/ \./g, '.'));
                                        break;
                                    }
                                }
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }));
    }

    function splitTextIntoChaptersAndArticles(text) {
        const chapters = {};
        const chapterMatches = text.match(/CHAPTER \d+.*?(?=(CHAPTER \d+|$))/gs);
        if (chapterMatches) {
            for (const chapterMatch of chapterMatches) {
                const chapterTitle = chapterMatch.trim().split('\n')[0];
                const chapterContent = chapterMatch.trim();
                const chapterArticles = splitTextIntoArticles(chapterContent);
                chapters[chapterTitle] = chapterArticles;
            }
        }
        return chapters;
    }

    function splitTextIntoArticles(text) {
        const articles = [];
        const articleMatches = text.match(/Article \d+\..*?(?=(Article \d+\.|\nCHAPTER \d+|$))/gs);
        if (articleMatches) {
            for (const articleMatch of articleMatches) {
                const sentences = articleMatch.trim().split(/\.\s+/);
                const articleSentences = sentences.map(sentence => sentence.match(/[\w']+|[.,!?;]/g));
                articles.push(articleSentences);
            }
        }
        return articles;
    }

    const splitText = splitTextIntoChaptersAndArticles(data);
    find(searchText, splitText);
});
