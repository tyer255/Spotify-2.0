const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

const oldRecommended = `      const recommendedPool = [
        ['Tum Kya Mile', 'Tere Hawaale', 'Apna Bana Le', 'O Maahi', 'Chaleya', 'Jhoome Jo Pathaan', 'Kesariya', 'Heeriye'],
        ['Softly Karan Aujla', 'Lover Diljit', 'Kinni Kinni', 'Winning Speech', 'Admirin You', 'Chauffeur', 'Peaches Diljit', 'Excuses AP Dhillon'],
        ['Maan Meri Jaan', 'Tu Aake Dekhle', 'Husn Anuv Jain', 'Baarishein', 'Alag Aasmaan', 'Choo Lo', 'Pehle Bhi Main', 'Akhiyaan Gulaab'],
        ['Arjan Vailly', 'Daku', 'We Rollin', '295 Sidhu', 'Levels Sidhu', 'Brown Munde', 'Summer High', 'No Love Shubh']
      ];`;

const newRecommended = `      const recommendedPool = [
        ['Sajni', 'Illuminati', 'Angaaron', 'O Maahi', 'Kiliye', 'Tauba Tauba Karan Aujla', 'Tainu Khabar Nahi', 'Aayi Nai'],
        ['Husn Anuv Jain', 'Tu Hai Kahan', 'O Sajni Re', 'Dekhha Tenu', 'Ve Haniya Danny', 'Zaalima', 'Guli Mata', 'Naina Diljit'],
        ['Softly Karan Aujla', 'Winning Speech', 'Kinni Kinni', 'Lover Diljit', 'Chaleya Jawan', 'Apna Bana Le Bhediya', 'Akhiyaan Gulaab', 'Pehle Bhi Main'],
        ['Arjan Vailly', 'Daku', 'We Rollin', '295 Sidhu', 'Levels Sidhu', 'Brown Munde', 'Summer High', 'No Love Shubh']
      ];`;

const oldTrending = `      const trendingHits = [
        'Tauba Tauba Karan Aujla',
        'Husn Anuv Jain',
        'O Maahi',
        'Pehle Bhi Main',
        'Ve Haniya Danny',
        'Bhairava Anthem Kalki'
      ];`;

const newTrending = `      const trendingHits = [
        'Tauba Tauba Karan Aujla',
        'Sajni',
        'Angaaron',
        'Illuminati Sushin Shyam',
        'Dekhha Tenu',
        'Aayi Nai'
      ];`;

const oldStartListening = `      const startListening = [
        'Lover Diljit Dosanjh',
        'Chaleya Jawan',
        'Apna Bana Le Bhediya',
        'Heeriye Arijit',
        'Tere Hawaale',
        'Maan Meri Jaan'
      ];`;

const newStartListening = `      const startListening = [
        'Tainu Khabar Nahi',
        'O Sajni Re',
        'Kiliye',
        'Tum Se',
        'Ve Haniya Danny',
        'Zaalima'
      ];`;

code = code.replace(oldRecommended, newRecommended);
code = code.replace(oldTrending, newTrending);
code = code.replace(oldStartListening, newStartListening);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
