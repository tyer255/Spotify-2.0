import { normalizeSearchString, cleanSearchTitle, stringSimilarity } from './searchRanker';
import { getArtistPortrait } from './artistPortraits';

export interface ArtistAliasEntry {
  canonicalName: string;
  realNames: string[];
  spotifyNames: string[];
  aliases: string[];
  genres?: string[];
  followers?: number;
  portraitUrl?: string;
  bio?: string;
}

/**
 * Comprehensive Multi-Genre Artist Knowledge Base
 * Maps canonical artist identities with their real legal names, Spotiz streaming monikers, and aliases.
 */
export const ARTIST_ALIAS_DATABASE: ArtistAliasEntry[] = [
  {
    canonicalName: 'Maanu',
    realNames: ['Manan Sikander', 'Maanu'],
    spotifyNames: ['Maanu', 'Maanu & Annural Khalid', 'Annural Khalid & Maanu'],
    aliases: ['Maanu Music', 'Maanu Official', 'Maanu Coke Studio', 'Maanu Jhol'],
    genres: ['Pakistani Indie', 'Pop', 'Hip-Hop', 'Desi Pop'],
    followers: 1850000,
    portraitUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/bf/16/c8/bf16c8ec-3b10-63ba-b2cb-1ba9326e5e0c/198015525547.jpg/600x600bb.jpg',
    bio: 'Maanu (Manan Sikander) is a critically acclaimed singer, songwriter, and rapper from Lahore, renowned for mega-hits including Jhol and 4U.',
  },
  {
    canonicalName: 'Annural Khalid',
    realNames: ['Annural Khalid'],
    spotifyNames: ['Annural Khalid', 'Annural', 'Maanu & Annural Khalid'],
    aliases: ['Annural Khalid Music', 'Annural Khalid Official', 'Annural Jhol', 'Anural Khalid'],
    genres: ['Pakistani Pop', 'Indie', 'Soulful Pop'],
    followers: 1650000,
    portraitUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/3c/65/913c65c6-2be1-0309-8809-ff9be5c4d3eb/18UMGIM78065.rgb.jpg/600x600bb.jpg',
    bio: 'Annural Khalid is a rising Pakistani singer-songwriter celebrated for her distinctive vocals on chart-toppers like Jhol and Pretty Lies.',
  },
  {
    canonicalName: 'Noor',
    realNames: ['Noor', 'Noor Khan'],
    spotifyNames: ['Noor'],
    aliases: ['Noor', 'Noor Khan', 'Khan, Noor'],
    genres: ['Hindi', 'Pop', 'Indie'],
    followers: 9573475,
    portraitUrl: 'https://i.scdn.co/image/ab6761610000e5ebe6000d557d1743d28cc7e71a',
    bio: 'Noor is an acclaimed Indian artist known for collaborating on chart-topping indie tracks like Aarzu.',
  },

  // --- Modern Indian Indie, Pop, Hip-Hop & Regional ---
  {
    canonicalName: 'High Born',
    realNames: ['Taabish', 'Tabish', 'Taabish Siddiqui', 'Tabish Siddiqui', 'Mohammad Taabish'],
    spotifyNames: ['High Born', 'Taabish', 'HighBorn', 'High Born (Taabish)', 'Taabish (High Born)'],
    aliases: ['Taabish High Born', 'High Born Taabish', 'Highborn', 'HighBorn Music', 'High Born Music', 'Taabish Official', 'Taabish Music', 'HighBorn Records'],
    genres: ['Indian Indie', 'Indie Pop', 'Pop', 'Soulful', 'Acoustic'],
    followers: 1250000,
    portraitUrl: '',
    bio: 'High Born (officially known as Taabish) is an Indian indie singer, songwriter, and composer recognized for emotive tracks including Tere Bina and Zamaana.',
  },
  {
    canonicalName: 'Madhurxo',
    realNames: ['Madhur Sharma'],
    spotifyNames: ['Madhurxo', 'Madhur Sharma', 'Madhur xo', 'madhurxo'],
    aliases: ['Madhur', 'MadhurXO', 'madhur_xo', 'Madhur Xo', 'Aarzu Madhur', 'Madhur Sharma'],
    genres: ['Indie Pop', 'Hindi Pop', 'Lofi'],
    followers: 10791142,
    portraitUrl: 'https://i.scdn.co/image/ab6761610000e5ebfc25b09e6a4ca0fae1ce7adb',
    bio: 'Madhurxo (Madhur Sharma) is an acclaimed Indian singer-songwriter known for soulful indie and lofi hits including Aarzu and Kali Kali Zulfon.',
  },
  {
    canonicalName: 'The Weeknd',
    realNames: ['Abel Tesfaye', 'Abel Makkonen Tesfaye', 'Abel M. Tesfaye'],
    spotifyNames: ['The Weeknd', 'Weeknd'],
    aliases: ['Abel', 'Starboy', 'The Weekend', 'Abel The Weeknd', 'Abel Tesfaye Weeknd'],
    genres: ['R&B', 'Pop', 'Synth-pop'],
    portraitUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616100005174c1719ac9e6a75c1c25835018',
    bio: 'The Weeknd (Abel Makkonen Tesfaye) is a Canadian singer, songwriter, and record producer known for sonic innovation and chart-topping hits.',
  },
  {
    canonicalName: 'Yo Yo Honey Singh',
    realNames: ['Hirdesh Singh'],
    spotifyNames: ['Yo Yo Honey Singh', 'Honey Singh'],
    aliases: ['Honey Singh', 'YoYo Honey Singh', 'Yo Yo', 'YoYo', 'Hirdesh', 'Honey 3.0', 'Paji'],
    genres: ['Desi Hip Hop', 'Punjabi Pop', 'Bollywood'],
    portraitUrl: '',
    bio: 'Yo Yo Honey Singh (born Hirdesh Singh) is an Indian music producer, rapper, and singer who revolutionized Punjabi and Hindi commercial pop music.',
  },
  {
    canonicalName: 'MC Stan',
    realNames: ['Altaf Tadavi', 'Altaf Shaikh', 'Altaf Tadavi Shaikh'],
    spotifyNames: ['MC STAN', 'MC Stan', 'Mc Stan'],
    aliases: ['Altaf', 'Stan', 'MCStan', 'Basti Ka Hasti', 'Tadipaar', 'Insaan'],
    genres: ['Indian Hip Hop', 'Trap', 'Pune Rap'],
    portraitUrl: '',
    bio: 'MC Stan (Altaf Tadavi) is an Indian rapper from Pune known for his distinctive raw trap style and chart-topping albums Tadipaar and Insaan.',
  },
  {
    canonicalName: 'KR$NA',
    realNames: ['Krishna Kaul'],
    spotifyNames: ['KR$NA', 'KRSNA', 'Krsna', 'Kr$na'],
    aliases: ['Krishna', 'Prozpekt', 'Dollar Sign', 'Krsna Kaul', 'Young Prozpekt', 'Kalamkaar'],
    genres: ['Desi Hip Hop', 'Lyrical Rap'],
    portraitUrl: '',
    bio: 'KR$NA (Krishna Kaul) is an Indian rapper and lyricist from New Delhi, celebrated as one of the pioneer lyricists in Desi Hip Hop.',
  },
  {
    canonicalName: 'B Praak',
    realNames: ['Pratik Bachan'],
    spotifyNames: ['B Praak', 'BPraak', 'B-Praak'],
    aliases: ['Pratik', 'B Praak Music', 'BPraak Official', 'Pratik Bachan B Praak'],
    genres: ['Punjabi Pop', 'Bollywood Sufi', 'Sad Romantic'],
    portraitUrl: '',
    bio: 'B Praak (Pratik Bachan) is a National Film Award-winning Indian singer and music composer renowned for emotive ballads.',
  },
  {
    canonicalName: 'DIVINE',
    realNames: ['Vivian Fernandes', 'Vivian Divine'],
    spotifyNames: ['DIVINE', 'Divine'],
    aliases: ['Vivian', 'Gully Gang', 'Gully Boy Divine', 'Vivian Fernandes Divine'],
    genres: ['Desi Hip Hop', 'Gully Rap'],
    portraitUrl: '',
    bio: 'DIVINE (Vivian Fernandes) is an Indian rapper from Mumbai who pioneered the Gully Rap movement across India.',
  },
  {
    canonicalName: 'Raftaar',
    realNames: ['Dilin Nair'],
    spotifyNames: ['Raftaar'],
    aliases: ['Dilin', 'Raa', 'Kalamkaar Raftaar', 'Dilin Nair Raftaar'],
    genres: ['Desi Hip Hop', 'Bollywood Pop'],
    portraitUrl: '',
    bio: 'Raftaar (Dilin Nair) is a renowned Indian rapper, music composer, and producer known for his fast flow and versatility.',
  },
  {
    canonicalName: 'King',
    realNames: ['Arpan Kumar Chandel', 'Arpan Chandel'],
    spotifyNames: ['King', 'KING'],
    aliases: ['Arpan', 'King Rocco', 'Maan Meri Jaan King', 'Arpan Kumar'],
    genres: ['Indian Pop', 'Hip Hop', 'Melodic Rap'],
    portraitUrl: '',
    bio: 'King (Arpan Kumar Chandel) is an Indian singer, songwriter, and rapper acclaimed for global hits like Maan Meri Jaan and Tu Aake Dekhle.',
  },
  {
    canonicalName: 'AP Dhillon',
    realNames: ['Amritpal Singh Dhillon', 'Amritpal Dhillon'],
    spotifyNames: ['AP Dhillon', 'A.P. Dhillon'],
    aliases: ['Amrit', 'AP', 'Brown Munde', 'Run-Up Records'],
    genres: ['Punjabi Pop', 'Melodic Hip Hop'],
    portraitUrl: '',
    bio: 'AP Dhillon (Amritpal Singh Dhillon) is an Indo-Canadian singer, rapper, and record producer known for redefining contemporary Punjabi soundscapes.',
  },
  {
    canonicalName: 'Sidhu Moose Wala',
    realNames: ['Shubhdeep Singh Sidhu', 'Shubhdeep Sidhu'],
    spotifyNames: ['Sidhu Moose Wala', 'Sidhu Moosewala'],
    aliases: ['Shubhdeep', 'Moosewala', 'Moose Wala', 'Sidhu', '5911', 'PBX 1'],
    genres: ['Punjabi Music', 'Gangsta Rap', 'Folk Pop'],
    portraitUrl: '',
    bio: 'Sidhu Moose Wala (Shubhdeep Singh Sidhu) was an iconic Indian singer, rapper, and songwriter regarded as one of the greatest Punjabi artists of all time.',
  },
  {
    canonicalName: 'Shubh',
    realNames: ['Shubhneet Singh'],
    spotifyNames: ['Shubh'],
    aliases: ['Shubhneet', 'Shubh Music', 'Still Rollin', 'Elevated'],
    genres: ['Punjabi Hip Hop', 'Trap'],
    portraitUrl: '',
    bio: 'Shubh (Shubhneet Singh) is an Indian singer and rapper known for breakthrough viral tracks like No Love, Baller, and Cheques.',
  },
  {
    canonicalName: 'Karan Aujla',
    realNames: ['Jaskaran Singh Aujla', 'Jaskaran Aujla'],
    spotifyNames: ['Karan Aujla'],
    aliases: ['Jaskaran', 'Geetan Di Machine', 'Aujla', 'Making Memories', 'Street Dreams'],
    genres: ['Punjabi Pop', 'Hip Hop'],
    portraitUrl: '',
    bio: 'Karan Aujla (Jaskaran Singh Aujla) is an Indian singer, songwriter, and rapper known as Geetan Di Machine for his prolific lyrical craft.',
  },
  {
    canonicalName: 'Diljit Dosanjh',
    realNames: ['Daljit Singh Dosanjh', 'Diljit Dosanjh'],
    spotifyNames: ['Diljit Dosanjh'],
    aliases: ['Daljit', 'Dosanjhanwala', 'Diljit', 'G.O.A.T.', 'Lover', 'Born to Shine'],
    genres: ['Punjabi Pop', 'Bhangra', 'Bollywood'],
    portraitUrl: '',
    bio: 'Diljit Dosanjh is a global Indian singer, actor, and producer who has taken Punjabi music to international festival stages like Coachella.',
  },
  {
    canonicalName: 'Harrdy Sandhu',
    realNames: ['Hardavinder Singh Sandhu', 'Hardy Sandhu'],
    spotifyNames: ['Harrdy Sandhu', 'Hardy Sandhu'],
    aliases: ['Hardy', 'Harrdy', 'Hardavinder Sandhu', 'Bijlee Bijlee'],
    genres: ['Punjabi Pop', 'Bollywood Pop'],
    portraitUrl: '',
    bio: 'Harrdy Sandhu (Hardavinder Singh Sandhu) is an Indian singer and former cricketer known for massive pop hits including Bijlee Bijlee and Kya Baat Ay.',
  },
  {
    canonicalName: 'Guru Randhawa',
    realNames: ['Gursharanjot Singh Randhawa'],
    spotifyNames: ['Guru Randhawa'],
    aliases: ['Gursharanjot', 'Guru', 'High Rated Gabru', 'Lahore'],
    genres: ['Punjabi Pop', 'Dance', 'Bollywood'],
    portraitUrl: '',
    bio: 'Guru Randhawa (Gursharanjot Singh Randhawa) is an Indian singer, songwriter, and music composer known for worldwide crossover pop hits.',
  },
  {
    canonicalName: 'Jaani',
    realNames: ['Jaani Johan'],
    spotifyNames: ['Jaani'],
    aliases: ['Jaani Johan', 'Jaani Music', 'Johan'],
    genres: ['Punjabi Lyrics', 'Bollywood Composition'],
    portraitUrl: '',
    bio: 'Jaani (Jaani Johan) is an acclaimed Indian lyricist and music composer behind landmark Punjabi and Bollywood romantic anthems.',
  },
  {
    canonicalName: 'Badshah',
    realNames: ['Aditya Prateek Singh Sisodia', 'Aditya Sisodia'],
    spotifyNames: ['Badshah'],
    aliases: ['Aditya', 'Bad Boy Badshah', 'Aditya Prateek', 'Genda Phool'],
    genres: ['Desi Hip Hop', 'Bollywood Party', 'Pop'],
    portraitUrl: '',
    bio: 'Badshah (Aditya Prateek Singh Sisodia) is an Indian rapper and music director known for blockbuster party anthems.',
  },
  {
    canonicalName: 'Emiway Bantai',
    realNames: ['Bilal Shaikh'],
    spotifyNames: ['Emiway Bantai', 'Emiway'],
    aliases: ['Bilal', 'Bantai', 'Bantai Records', 'Machayenge'],
    genres: ['Desi Hip Hop', 'Street Rap'],
    portraitUrl: '',
    bio: 'Emiway Bantai (Bilal Shaikh) is an independent Indian rapper from Mumbai known for chart-topping viral anthems like Machayenge.',
  },
  {
    canonicalName: 'Seedhe Maut',
    realNames: ['Siddhant Sharma', 'Abhijay Negi'],
    spotifyNames: ['Seedhe Maut'],
    aliases: ['Calm', 'Encore ABJ', 'SM', 'TBSM', 'Nanchaku', 'Lunch Break'],
    genres: ['Desi Hip Hop', 'Underground Rap'],
    portraitUrl: '',
    bio: 'Seedhe Maut is a pioneering New Delhi hip-hop duo consisting of Calm (Siddhant Sharma) and Encore ABJ (Abhijay Negi).',
  },
  {
    canonicalName: 'Brodha V',
    realNames: ['Vighnesh Shivanand'],
    spotifyNames: ['Brodha V'],
    aliases: ['Vighnesh', 'Brodha', 'Aathma Raama'],
    genres: ['Indian Hip Hop', 'Carnatic Fusion Rap'],
    portraitUrl: '',
    bio: 'Brodha V (Vighnesh Shivanand) is an Indian rapper from Bengaluru known for combining classical Indian melodies with rapid-fire hip-hop.',
  },
  {
    canonicalName: 'Talwiinder',
    realNames: ['Talwinder Singh'],
    spotifyNames: ['Talwiinder', 'Talwinder'],
    aliases: ['Talwinder Singh', 'Gaah', 'Dhur'],
    genres: ['Punjabi Indie', 'Experimental Alternative'],
    portraitUrl: '',
    bio: 'Talwiinder is an innovative Punjabi artist known for blending soulful indie songwriting with electronic and synthwave production.',
  },
  {
    canonicalName: 'Mitraz',
    realNames: ['Pratik Verma', 'Anupam Roy'],
    spotifyNames: ['Mitraz', 'MITRAZ'],
    aliases: ['Mitraz Music', 'Akhiyaan', 'Junoon'],
    genres: ['Indie Pop', 'Hindi Lofi'],
    portraitUrl: '',
    bio: 'Mitraz is an Indian indie music duo composed of Pratik Verma and Anupam Roy, creators of viral romantic hits like Akhiyaan.',
  },
  {
    canonicalName: 'The Local Train',
    realNames: ['Raman Negi', 'Paras Thakur', 'Ramit Mehra', 'Sahil Sarin'],
    spotifyNames: ['The Local Train'],
    aliases: ['Local Train', 'Raman Negi', 'Choo Lo', 'Aalas Ka Pedh'],
    genres: ['Hindi Rock', 'Indie Rock'],
    portraitUrl: '',
    bio: 'The Local Train is an iconic Indian rock band renowned for classic anthems including Choo Lo, Aaoge Tum Kabhi, and Dil Mere.',
  },
  {
    canonicalName: 'Anuv Jain',
    realNames: ['Anuv Jain'],
    spotifyNames: ['Anuv Jain'],
    aliases: ['Anuv', 'Baarishein', 'Husn', 'Alag Aasmaan', 'Mishri'],
    genres: ['Indie Pop', 'Acoustic Folk'],
    portraitUrl: 'https://i.scdn.co/image/ab6761610000e5eba837a6cb82dd949d5e1f9b53',
    bio: 'Anuv Jain is an Indian singer-songwriter celebrated for intimate acoustic storytelling and viral hits like Husn and Baarishein.',
  },
  {
    canonicalName: 'Prateek Kuhad',
    realNames: ['Prateek Kuhad'],
    spotifyNames: ['Prateek Kuhad'],
    aliases: ['Prateek', 'Cold Mess', 'Kasoor', 'Kho Gaye Hum Kahan'],
    genres: ['Indie Folk', 'Acoustic'],
    portraitUrl: '',
    bio: 'Prateek Kuhad is an acclaimed indie folk singer-songwriter whose song Cold Mess earned global praise from Barack Obama.',
  },
  {
    canonicalName: 'Ritviz',
    realNames: ['Ritviz Srivastava'],
    spotifyNames: ['Ritviz'],
    aliases: ['Ritviz Srivastava', 'Udd Gaye', 'Liggi', 'Sage', 'Ved'],
    genres: ['Indian Electronic', 'Classical Fusion', 'Future Bass'],
    portraitUrl: '',
    bio: 'Ritviz (Ritviz Srivastava) is an Indian electronic music producer and singer renowned for fusing Indian classical vocals with future bass.',
  },
  {
    canonicalName: 'Nucleya',
    realNames: ['Udyan Sagar'],
    spotifyNames: ['Nucleya'],
    aliases: ['Udyan Sagar', 'Udyan', 'Bass Rani', 'Koocha Monster', 'Raja Baja'],
    genres: ['Desi Bass', 'Electronic Dance'],
    portraitUrl: '',
    bio: 'Nucleya (Udyan Sagar) is the pioneer of Indian street bass and EDM, blending regional street sounds with heavy sub-bass.',
  },
  {
    canonicalName: 'KSHMR',
    realNames: ['Niles Hollowell-Dhar'],
    spotifyNames: ['KSHMR'],
    aliases: ['Niles', 'The Cataracs', 'Kashmir', 'Karam'],
    genres: ['EDM', 'Big Room House', 'Desi EDM'],
    portraitUrl: '',
    bio: 'KSHMR (Niles Hollowell-Dhar) is an American electronic DJ and producer celebrated for infusing Indian orchestral themes into dance music.',
  },

  // --- Bollywood & Indian Masters & Composers ---
  {
    canonicalName: 'A.R. Rahman',
    realNames: ['A. S. Dileep Kumar', 'Dileep Kumar', 'Allahrakka Rahman', 'A S Dileep Kumar'],
    spotifyNames: ['A.R. Rahman', 'AR Rahman', 'A. R. Rahman', 'A.R.Rahman'],
    aliases: ['Rahman', 'Isai Puyal', 'Mozart of Madras', 'AR. Rahman', 'A R Rahman'],
    genres: ['Film Score', 'World Music', 'Indian Classical Fusion'],
    portraitUrl: '',
    bio: 'A. R. Rahman (born A. S. Dileep Kumar) is a two-time Academy Award and Grammy-winning composer, singer, and music producer.',
  },
  {
    canonicalName: 'Kishore Kumar',
    realNames: ['Abhas Kumar Ganguly', 'Abhas Ganguly'],
    spotifyNames: ['Kishore Kumar'],
    aliases: ['Kishore Da', 'Kishore', 'Abhas Kumar', 'Kishore Kumar Ganguly'],
    genres: ['Bollywood Classic', 'Vintage Filmi'],
    portraitUrl: '',
    bio: 'Kishore Kumar (Abhas Kumar Ganguly) was a legendary Indian playback singer and actor renowned for his unmatched vocal versatility.',
  },
  {
    canonicalName: 'Mohammed Rafi',
    realNames: ['Mohammed Rafi'],
    spotifyNames: ['Mohammed Rafi', 'Mohd Rafi', 'Mohd. Rafi'],
    aliases: ['Rafi', 'Rafi Saab', 'Mohammad Rafi', 'Rafi Sahib'],
    genres: ['Bollywood Classic', 'Ghazal', 'Qawwali'],
    portraitUrl: '',
    bio: 'Mohammed Rafi is widely considered one of the greatest and most influential playback singers of the Indian subcontinent.',
  },
  {
    canonicalName: 'Lata Mangeshkar',
    realNames: ['Lata Mangeshkar', 'Hema Mangeshkar'],
    spotifyNames: ['Lata Mangeshkar'],
    aliases: ['Lata Didi', 'Nightingale of India', 'Lata', 'Queen of Melody'],
    genres: ['Bollywood Classic', 'Devotional', 'Ghazal'],
    portraitUrl: '',
    bio: 'Lata Mangeshkar, the Nightingale of India, was an iconic playback singer whose career spanned seven decades.',
  },
  {
    canonicalName: 'Asha Bhosle',
    realNames: ['Asha Bhosle', 'Asha Bhonsle'],
    spotifyNames: ['Asha Bhosle', 'Asha Bhonsle'],
    aliases: ['Asha Tai', 'Asha', 'Ashaji'],
    genres: ['Bollywood Classic', 'Cabaret', 'Pop', 'Indipop'],
    portraitUrl: '',
    bio: 'Asha Bhosle is a legendary Indian playback singer renowned for her vocal range and versatile repertoire across thousands of songs.',
  },
  {
    canonicalName: 'R.D. Burman',
    realNames: ['Rahul Dev Burman'],
    spotifyNames: ['R.D. Burman', 'R. D. Burman', 'RD Burman'],
    aliases: ['Pancham', 'Pancham Da', 'Rahul Dev Burman', 'R D Burman', 'Panchamda'],
    genres: ['Bollywood Retro', 'Jazz Fusion', 'Psychedelic Rock'],
    portraitUrl: '',
    bio: 'R. D. Burman (Pancham Da) was an innovator who revolutionized Indian cinema music by blending Western rock and jazz with Indian melodies.',
  },
  {
    canonicalName: 'S.D. Burman',
    realNames: ['Sachin Dev Burman'],
    spotifyNames: ['S.D. Burman', 'S. D. Burman', 'SD Burman'],
    aliases: ['Sachin Dev Burman', 'Burman Da', 'Sachin Karta'],
    genres: ['Bollywood Classic', 'Folk Fusion'],
    portraitUrl: '',
    bio: 'Sachin Dev Burman was an Indian music director and singer who created timeless folk-infused masterpieces for classic Bollywood.',
  },
  {
    canonicalName: 'Atif Aslam',
    realNames: ['Muhammad Atif Aslam', 'Atif Aslam', 'Aatif Aslam'],
    spotifyNames: ['Atif Aslam', 'Aatif Aslam'],
    aliases: ['Aatif Aslam', 'Atif', 'Aatif', 'Muhammad Atif Aslam', 'Rustom', 'Tere Sang Yaara', 'Tajdar-e-Haram', 'Pehli Nazar Mein', 'Tu Jaane Na', 'Woh Lamhe', 'Jeene Laga Hoon', 'Dil Diyan Gallan', 'Tere Bin', 'Tere Liye', 'Tera Hone Laga Hoon', 'Main Rang Sharbaton Ka', 'Jeena Jeena', 'Hona Tha Pyar', 'Aadat'],
    genres: ['Bollywood Romantic', 'Sufi Rock', 'Pop Ballad'],
    portraitUrl: 'https://i.scdn.co/image/ab6761610000e5ebc40600e02356cc86f0debe84',
    bio: 'Atif Aslam (Muhammad Atif Aslam) is an acclaimed Pakistani playback singer, songwriter, and composer globally celebrated for timeless Bollywood romance classics including Tere Sang Yaara, Pehli Nazar Mein, Tu Jaane Na, Dil Diyan Gallan, and Tajdar-e-Haram.',
  },
  {
    canonicalName: 'Arko',
    realNames: ['Arko Pravo Mukherjee'],
    spotifyNames: ['Arko', 'Arko Pravo Mukherjee'],
    aliases: ['Arko Mukherjee', 'Arko Pravo', 'Tere Sang Yaara', 'O Saathi', 'Nazm Nazm', 'Teri Mitti'],
    genres: ['Bollywood Composition', 'Romantic', 'Acoustic'],
    portraitUrl: 'https://cdn-images.dzcdn.net/images/artist/f1a0baaa3104e43b1745db74efbf9100/1000x1000-000000-80-0-0.jpg',
    bio: 'Arko (Arko Pravo Mukherjee) is an acclaimed Indian music composer, singer, and lyricist behind landmark songs like Tere Sang Yaara, O Saathi, Nazm Nazm, and Teri Mitti.',
  },
  {
    canonicalName: 'Manoj Muntashir',
    realNames: ['Manoj Muntashir Shukla'],
    spotifyNames: ['Manoj Muntashir'],
    aliases: ['Manoj Muntashir Shukla', 'Muntashir', 'Tere Sang Yaara', 'Teri Mitti', 'Galliyan'],
    genres: ['Bollywood Lyrics', 'Poetry', 'Romantic'],
    portraitUrl: 'https://cdn-images.dzcdn.net/images/artist/b6f5cfb54d607a9080b06b0dccfb5b61/1000x1000-000000-80-0-0.jpg',
    bio: 'Manoj Muntashir is a National Award-winning Indian lyricist, poet, and screenwriter acclaimed for heartfelt anthems such as Tere Sang Yaara, Teri Mitti, and Galliyan.',
  },
  {
    canonicalName: 'Sonu Nigam',
    realNames: ['Sonu Nigam'],
    spotifyNames: ['Sonu Nigam'],
    aliases: ['Sonu', 'Sonu Nigaam', 'Kal Ho Naa Ho', 'Abhi Mujh Mein Kahin', 'Suraj Hua Maddham', 'Main Agar Kahoon', 'Tumhi Dekho Na'],
    genres: ['Bollywood Classical', 'Romantic', 'Pop'],
    portraitUrl: '',
    bio: 'Sonu Nigam is a legendary Indian playback singer and musician revered as one of the finest and most versatile voices in modern Indian music history.',
  },
  {
    canonicalName: 'Rahat Fateh Ali Khan',
    realNames: ['Rahat Fateh Ali Khan'],
    spotifyNames: ['Rahat Fateh Ali Khan', 'Ustad Rahat Fateh Ali Khan'],
    aliases: ['Rahat', 'RFAK', 'Ustad Rahat', 'O Re Piya', 'Afreen Afreen', 'Teri Ore', 'Zaroori Tha', 'Bol Na Halke Halke'],
    genres: ['Sufi', 'Qawwali', 'Bollywood Romantic'],
    portraitUrl: '',
    bio: 'Ustad Rahat Fateh Ali Khan is a world-renowned Pakistani musician and Qawwali singer carrying forward the revered musical heritage of the Gharana.',
  },
  {
    canonicalName: 'KK',
    realNames: ['Krishnakumar Kunnath'],
    spotifyNames: ['KK', 'K.K.', 'K K'],
    aliases: ['Krishnakumar', 'Kay Kay', 'K. K.', 'Krishnakumar K'],
    genres: ['Bollywood Rock', 'Pop Ballads', 'Romantic'],
    portraitUrl: '',
    bio: 'KK (Krishnakumar Kunnath) was an Indian playback singer celebrated for defining the sound of 2000s Bollywood rock and emotive youth anthems.',
  },
  {
    canonicalName: 'Arijit Singh',
    realNames: ['Arijit Singh'],
    spotifyNames: ['Arijit Singh'],
    aliases: ['Arijit', 'Arijit Da', 'अरिजीत सिंह', 'अरिजित सिंह'],
    genres: ['Bollywood Romantic', 'Sufi', 'Pop Ballad'],
    portraitUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616100005174adfb0b2df04b77e43b5f7375',
    bio: 'Arijit Singh is India’s premier playback singer and composer, globally recognized for his soul-stirring vocal depth.',
  },
  {
    canonicalName: 'Shreya Ghoshal',
    realNames: ['Shreya Ghoshal'],
    spotifyNames: ['Shreya Ghoshal'],
    aliases: ['Shreya', 'श्रेया घोषाल', 'Shreya Ghoshal Official'],
    genres: ['Bollywood Romantic', 'Classical', 'Melody'],
    portraitUrl: '',
    bio: 'Shreya Ghoshal is a multiple National Film Award-winning Indian playback singer recognized worldwide for her pitch-perfect vocal artistry.',
  },
  {
    canonicalName: 'Shaan',
    realNames: ['Shantanu Mukherjee'],
    spotifyNames: ['Shaan'],
    aliases: ['Shantanu Mukherjee', 'Shantanu', 'Shaan Singer'],
    genres: ['Bollywood Pop', 'Indipop'],
    portraitUrl: '',
    bio: 'Shaan (Shantanu Mukherjee) is a beloved Indian playback singer and television host known for joyful pop anthems.',
  },
  {
    canonicalName: 'Papon',
    realNames: ['Angaraag Mahanta'],
    spotifyNames: ['Papon'],
    aliases: ['Angaraag', 'Angaraag Mahanta', 'Papon Mahanta'],
    genres: ['Assamese Folk', 'Bollywood Sufi', 'Acoustic'],
    portraitUrl: '',
    bio: 'Papon (Angaraag Mahanta) is an Indian singer, composer, and multi-instrumentalist from Assam known for Moh Moh Ke Dhaage.',
  },
  {
    canonicalName: 'Lucky Ali',
    realNames: ['Maqsood Mahmood Ali', 'Maqsood Ali'],
    spotifyNames: ['Lucky Ali'],
    aliases: ['Maqsood Ali', 'Lucky', 'O Sanam'],
    genres: ['Indipop', 'Acoustic Ballad'],
    portraitUrl: '',
    bio: 'Lucky Ali (Maqsood Mahmood Ali) is an Indian singer, songwriter, and actor who defined 90s Indipop with albums like Sunoh and Sifar.',
  },
  {
    canonicalName: 'Pritam',
    realNames: ['Pritam Chakraborty'],
    spotifyNames: ['Pritam'],
    aliases: ['Pritam Chakraborty', 'Pritam Da', 'JAM8'],
    genres: ['Bollywood Soundtrack', 'Pop Rock'],
    portraitUrl: '',
    bio: 'Pritam (Pritam Chakraborty) is an Indian composer and music director who has produced two decades of Bollywood chart-toppers.',
  },
  {
    canonicalName: 'Vishal-Shekhar',
    realNames: ['Vishal Dadlani', 'Shekhar Ravjiani'],
    spotifyNames: ['Vishal-Shekhar', 'Vishal & Shekhar', 'Vishal and Shekhar'],
    aliases: ['Vishal Dadlani', 'Shekhar Ravjiani', 'Vishal Shekhar'],
    genres: ['Bollywood Rock', 'Pop Dance'],
    portraitUrl: '',
    bio: 'Vishal-Shekhar is an Indian music directing duo of Vishal Dadlani and Shekhar Ravjiani.',
  },
  {
    canonicalName: 'Ajay-Atul',
    realNames: ['Ajay Gogavale', 'Atul Gogavale'],
    spotifyNames: ['Ajay-Atul', 'Ajay - Atul'],
    aliases: ['Ajay Atul', 'Ajay Gogavale', 'Atul Gogavale', 'Zingaat'],
    genres: ['Orchestral Bollywood', 'Marathi Folk'],
    portraitUrl: '',
    bio: 'Ajay-Atul are a National Award-winning Indian music composer duo known for massive live orchestral arrangements.',
  },
  {
    canonicalName: 'Sachin-Jigar',
    realNames: ['Sachin Sanghvi', 'Jigar Saraiya'],
    spotifyNames: ['Sachin-Jigar', 'Sachin - Jigar'],
    aliases: ['Sachin Jigar', 'Sachin Sanghvi', 'Jigar Saraiya'],
    genres: ['Bollywood Pop', 'Gujarati Folk'],
    portraitUrl: '',
    bio: 'Sachin-Jigar are an Indian music composer duo known for Stree, Bhediya, and contemporary Gujarati hits.',
  },
  {
    canonicalName: 'Shankar-Ehsaan-Loy',
    realNames: ['Shankar Mahadevan', 'Ehsaan Noorani', 'Loy Mendonsa'],
    spotifyNames: ['Shankar-Ehsaan-Loy', 'Shankar Ehsaan Loy'],
    aliases: ['SEL', 'Shankar Mahadevan', 'Ehsaan Noorani', 'Loy Mendonsa'],
    genres: ['Bollywood Fusion', 'Indian Classical Rock'],
    portraitUrl: '',
    bio: 'Shankar-Ehsaan-Loy (SEL) are a trio of Indian composers and musicians who created iconic scores including Dil Chahta Hai and Kal Ho Naa Ho.',
  },
  {
    canonicalName: 'Salim-Sulaiman',
    realNames: ['Salim Merchant', 'Sulaiman Merchant'],
    spotifyNames: ['Salim-Sulaiman', 'Salim - Sulaiman'],
    aliases: ['Salim Sulaiman', 'Salim Merchant', 'Sulaiman Merchant'],
    genres: ['Bollywood Sufi', 'Electronic Devotional'],
    portraitUrl: '',
    bio: 'Salim-Sulaiman are an Indian composer duo of brothers Salim and Sulaiman Merchant.',
  },
  {
    canonicalName: 'Ilaiyaraaja',
    realNames: ['Gnanathesikan', 'R. Gnanathesikan'],
    spotifyNames: ['Ilaiyaraaja', 'Ilaiyaraja', 'Ilayaraja'],
    aliases: ['Isaignani', 'Gnanathesikan', 'Raaja', 'Maestro Ilaiyaraaja'],
    genres: ['South Indian Cinema', 'Symphonic Fusion'],
    portraitUrl: '',
    bio: 'Ilaiyaraaja (born Gnanathesikan) is a legendary Indian composer who has scored over 1,000 films and composed over 7,000 songs.',
  },
  {
    canonicalName: 'Anirudh Ravichander',
    realNames: ['Anirudh Ravichander'],
    spotifyNames: ['Anirudh Ravichander', 'Anirudh'],
    aliases: ['Anirudh', 'Ani', 'Rockstar Anirudh', 'Anirudh R'],
    genres: ['Kollywood', 'Indian Pop', 'EDM Fusion'],
    portraitUrl: '',
    bio: 'Anirudh Ravichander is an Indian music composer and singer renowned for high-voltage anthems in Tamil, Telugu, and Hindi cinema.',
  },
  {
    canonicalName: 'M. M. Keeravani',
    realNames: ['Koduri Marakathamani Keeravani', 'Marakathamani'],
    spotifyNames: ['M. M. Keeravaani', 'M.M. Keeravani', 'Keeravani', 'M.M. Keeravaani'],
    aliases: ['Marakathamani', 'MM Kreem', 'M.M. Kreem', 'Keeravani', 'Naatu Naatu'],
    genres: ['Tollywood', 'Oscar Winning Film Score'],
    portraitUrl: '',
    bio: 'M. M. Keeravani (MM Kreem / Marakathamani) is an Academy Award and Golden Globe-winning Indian music composer best known for RRR and Baahubali.',
  },
  {
    canonicalName: 'Hiphop Tamizha',
    realNames: ['Adhithya Venkatapathy', 'Adhi'],
    spotifyNames: ['Hiphop Tamizha'],
    aliases: ['Adhi', 'Aadhi', 'Hiphop Aadhi', 'Adhi Hiphop Tamizha'],
    genres: ['Tamil Hip Hop', 'Film Score'],
    portraitUrl: '',
    bio: 'Hiphop Tamizha is an Indian musical duo consisting of Adhi (Adhithya) and Jeeva, credited as pioneers of Tamil hip-hop.',
  },
  {
    canonicalName: 'Sid Sriram',
    realNames: ['Sidharth Sriram'],
    spotifyNames: ['Sid Sriram'],
    aliases: ['Sidharth Sriram', 'Sid', 'Srivalli'],
    genres: ['Carnatic Fusion', 'South Indian Cinema', 'Soul'],
    portraitUrl: '',
    bio: 'Sid Sriram (Sidharth Sriram) is an Indian-American Carnatic musician and playback singer celebrated for poignant vocal depth.',
  },

  // --- Global Pop, Hip-Hop, Rock, EDM & International Stars ---
  {
    canonicalName: 'Eminem',
    realNames: ['Marshall Mathers', 'Marshall Bruce Mathers III', 'Marshall B Mathers'],
    spotifyNames: ['Eminem'],
    aliases: ['Slim Shady', 'Marshall Mathers', 'Em', 'Shady', 'Marshall'],
    genres: ['Hip Hop', 'Rap'],
    portraitUrl: '',
    bio: 'Eminem (Marshall Bruce Mathers III) is an American rapper and cultural icon known for his technical precision and storytelling.',
  },
  {
    canonicalName: 'Post Malone',
    realNames: ['Austin Post', 'Austin Richard Post'],
    spotifyNames: ['Post Malone'],
    aliases: ['Posty', 'Austin Post', 'Post', 'Austin'],
    genres: ['Hip Hop', 'Pop', 'Country', 'Rock'],
    portraitUrl: '',
    bio: 'Post Malone (Austin Richard Post) is an American singer, songwriter, and producer known for blending hip-hop, pop, and rock.',
  },
  {
    canonicalName: 'Drake',
    realNames: ['Aubrey Graham', 'Aubrey Drake Graham'],
    spotifyNames: ['Drake'],
    aliases: ['Aubrey Graham', 'Champagne Papi', 'Drizzy', '6 God', 'Aubrey'],
    genres: ['Hip Hop', 'R&B', 'Pop Rap'],
    portraitUrl: '',
    bio: 'Drake (Aubrey Drake Graham) is a Canadian rapper, singer, and actor credited for popularizing R&B sensibilities in modern hip-hop.',
  },
  {
    canonicalName: 'Travis Scott',
    realNames: ['Jacques Webster', 'Jacques Bermon Webster II'],
    spotifyNames: ['Travis Scott'],
    aliases: ['Jacques Webster', 'La Flame', 'Cactus Jack', 'Jacques'],
    genres: ['Hip Hop', 'Trap', 'Psychedelic Rap'],
    portraitUrl: '',
    bio: 'Travis Scott (Jacques Bermon Webster II) is an American rapper and producer famous for atmospheric trap production.',
  },
  {
    canonicalName: 'Lady Gaga',
    realNames: ['Stefani Germanotta', 'Stefani Joanne Angelina Germanotta'],
    spotifyNames: ['Lady Gaga'],
    aliases: ['Stefani Germanotta', 'Gaga', 'Mother Monster', 'Stefani'],
    genres: ['Pop', 'Dance', 'Electro-pop'],
    portraitUrl: '',
    bio: 'Lady Gaga (Stefani Joanne Angelina Germanotta) is an American singer, songwriter, and actress known for visual reinventions and vocal power.',
  },
  {
    canonicalName: 'Lana Del Rey',
    realNames: ['Elizabeth Grant', 'Elizabeth Woolridge Grant'],
    spotifyNames: ['Lana Del Rey'],
    aliases: ['Elizabeth Grant', 'Lizzy Grant', 'Lana', 'Lizzy'],
    genres: ['Sadcore', 'Dream Pop', 'Baroque Pop'],
    portraitUrl: '',
    bio: 'Lana Del Rey (Elizabeth Woolridge Grant) is an American singer-songwriter renowned for cinematic melancholy and poetic lyricism.',
  },
  {
    canonicalName: 'Bruno Mars',
    realNames: ['Peter Gene Hernandez', 'Peter Hernandez'],
    spotifyNames: ['Bruno Mars'],
    aliases: ['Peter Hernandez', 'Bruno', 'Silk Sonic', 'Peter Gene'],
    genres: ['Pop', 'Funk', 'R&B', 'Soul'],
    portraitUrl: '',
    bio: 'Bruno Mars (Peter Gene Hernandez) is an American singer, songwriter, and dancer celebrated for retro showmanship.',
  },
  {
    canonicalName: 'Lorde',
    realNames: ['Ella Yelich-O\'Connor', 'Ella Marija Lani Yelich-O\'Connor', 'Ella Yelich O\'Connor'],
    spotifyNames: ['Lorde'],
    aliases: ['Ella Yelich O\'Connor', 'Ella', 'Royals Lorde'],
    genres: ['Art Pop', 'Indie Pop', 'Electropop'],
    portraitUrl: '',
    bio: 'Lorde (Ella Yelich-O\'Connor) is a New Zealand singer-songwriter who rose to global stardom with Royals and Pure Heroine.',
  },
  {
    canonicalName: 'Nicki Minaj',
    realNames: ['Onika Maraj', 'Onika Tanya Maraj', 'Onika Tanya Maraj-Petty'],
    spotifyNames: ['Nicki Minaj'],
    aliases: ['Onika Maraj', 'Nicki', 'Barbie', 'Queen of Rap', 'Onika'],
    genres: ['Hip Hop', 'Pop Rap', 'Dancehall'],
    portraitUrl: '',
    bio: 'Nicki Minaj (Onika Tanya Maraj) is a Trinidadian-born rapper and singer recognized as one of the best-selling female rap artists of all time.',
  },
  {
    canonicalName: 'Cardi B',
    realNames: ['Belcalis Almánzar', 'Belcalis Marlenis Almánzar Cephus', 'Belcalis Almanzar'],
    spotifyNames: ['Cardi B'],
    aliases: ['Belcalis Almanzar', 'Cardi', 'Bacardi', 'Belcalis'],
    genres: ['Hip Hop', 'Trap'],
    portraitUrl: '',
    bio: 'Cardi B (Belcalis Almánzar) is an American rapper known for her unapologetic flow and record-breaking debut album Invasion of Privacy.',
  },
  {
    canonicalName: 'Bad Bunny',
    realNames: ['Benito Antonio Martínez Ocasio', 'Benito Martinez'],
    spotifyNames: ['Bad Bunny'],
    aliases: ['Benito', 'San Benito', 'El Conejo Malo', 'Benito Martinez'],
    genres: ['Reggaeton', 'Latin Trap'],
    portraitUrl: '',
    bio: 'Bad Bunny (Benito Antonio Martínez Ocasio) is a Puerto Rican rapper and singer who became the world’s most streamed artist.',
  },
  {
    canonicalName: 'Childish Gambino',
    realNames: ['Donald Glover', 'Donald McKinley Glover Jr.'],
    spotifyNames: ['Childish Gambino'],
    aliases: ['Donald Glover', 'Gambino', 'mcDJ', 'This Is America'],
    genres: ['Funk', 'Psychedelic Soul', 'Hip Hop'],
    portraitUrl: '',
    bio: 'Childish Gambino (Donald Glover) is a multi-talented American artist, musician, actor, and director known for Redbone and This Is America.',
  },
  {
    canonicalName: 'Frank Ocean',
    realNames: ['Christopher Breaux', 'Christopher Francis Ocean'],
    spotifyNames: ['Frank Ocean'],
    aliases: ['Christopher Breaux', 'Lonny Breaux', 'Frank', 'Blonde'],
    genres: ['Neo-Soul', 'Alternative R&B'],
    portraitUrl: '',
    bio: 'Frank Ocean (Christopher Edwin Breaux) is an acclaimed American singer-songwriter known for Channel Orange and Blonde.',
  },
  {
    canonicalName: 'Future',
    realNames: ['Nayvadius DeMun Wilburn', 'Nayvadius Wilburn'],
    spotifyNames: ['Future'],
    aliases: ['Nayvadius Wilburn', 'Pluto', 'Hendrix', 'Future Hendrix', 'Nayvadius'],
    genres: ['Trap', 'Hip Hop'],
    portraitUrl: '',
    bio: 'Future (Nayvadius DeMun Wilburn) is an influential American rapper known for pioneering melodic autotune trap music.',
  },
  {
    canonicalName: '50 Cent',
    realNames: ['Curtis Jackson', 'Curtis James Jackson III'],
    spotifyNames: ['50 Cent'],
    aliases: ['Curtis Jackson', 'Fifty Cent', '50', 'Curtis'],
    genres: ['Hip Hop', 'Gangsta Rap'],
    portraitUrl: '',
    bio: '50 Cent (Curtis James Jackson III) is an American rapper and business mogul famous for his landmark debut Get Rich or Die Tryin\'.',
  },
  {
    canonicalName: 'JAY-Z',
    realNames: ['Shawn Carter', 'Shawn Corey Carter'],
    spotifyNames: ['JAY-Z', 'Jay-Z', 'Jay Z'],
    aliases: ['Shawn Carter', 'Hov', 'Hova', 'Jigga', 'Shawn'],
    genres: ['Hip Hop', 'East Coast Rap'],
    portraitUrl: '',
    bio: 'JAY-Z (Shawn Corey Carter) is an American rapper, songwriter, and media proprietor widely regarded as one of the greatest hip-hop artists.',
  },
  {
    canonicalName: 'Snoop Dogg',
    realNames: ['Calvin Broadus', 'Calvin Cordozar Broadus Jr.'],
    spotifyNames: ['Snoop Dogg'],
    aliases: ['Snoop Lion', 'Calvin Broadus', 'Snoop Doggy Dogg', 'Snoop', 'Calvin'],
    genres: ['West Coast Hip Hop', 'G-Funk'],
    portraitUrl: '',
    bio: 'Snoop Dogg (Calvin Cordozar Broadus Jr.) is an American rapper and media personality who defined the 90s West Coast G-Funk sound.',
  },
  {
    canonicalName: 'Freddie Mercury',
    realNames: ['Farrokh Bulsara'],
    spotifyNames: ['Freddie Mercury', 'Queen'],
    aliases: ['Farrokh Bulsara', 'Queen', 'Freddie', 'Farrokh'],
    genres: ['Rock', 'Glam Rock', 'Operatic Rock'],
    portraitUrl: '',
    bio: 'Freddie Mercury (Farrokh Bulsara) was the legendary British lead vocalist of Queen, revered for his four-octave vocal range and theatrical flair.',
  },
  {
    canonicalName: 'Elton John',
    realNames: ['Reginald Dwight', 'Reginald Kenneth Dwight'],
    spotifyNames: ['Elton John'],
    aliases: ['Reginald Dwight', 'Rocket Man', 'Sir Elton', 'Reggie'],
    genres: ['Pop Rock', 'Glam Rock', 'Soft Rock'],
    portraitUrl: '',
    bio: 'Sir Elton John (born Reginald Kenneth Dwight) is an English singer, pianist, and composer who has sold over 300 million records.',
  },
  {
    canonicalName: 'David Bowie',
    realNames: ['David Jones', 'David Robert Jones'],
    spotifyNames: ['David Bowie'],
    aliases: ['David Jones', 'Ziggy Stardust', 'The Thin White Duke', 'Bowie'],
    genres: ['Art Rock', 'Glam Rock', 'Experimental Pop'],
    portraitUrl: '',
    bio: 'David Bowie (David Robert Jones) was an English singer-songwriter and visionary who redefined popular music across five decades.',
  },
  {
    canonicalName: 'Avicii',
    realNames: ['Tim Bergling'],
    spotifyNames: ['Avicii'],
    aliases: ['Tim Bergling', 'Tim', 'Tom Hangs', 'Wake Me Up Avicii'],
    genres: ['Progressive House', 'EDM Pop', 'Melodic House'],
    portraitUrl: '',
    bio: 'Avicii (Tim Bergling) was a Swedish DJ and music producer who revolutionized electronic dance music with global hits like Wake Me Up and Levels.',
  },
  {
    canonicalName: 'Marshmello',
    realNames: ['Christopher Comstock'],
    spotifyNames: ['Marshmello'],
    aliases: ['Christopher Comstock', 'Dotcom', 'Mello', 'Chris Comstock'],
    genres: ['Future Bass', 'Dance Pop', 'EDM'],
    portraitUrl: '',
    bio: 'Marshmello (Christopher Comstock) is an American electronic music producer and DJ known for massive crossover pop anthems.',
  },
  {
    canonicalName: 'Calvin Harris',
    realNames: ['Adam Wiles', 'Adam Richard Wiles'],
    spotifyNames: ['Calvin Harris'],
    aliases: ['Adam Wiles', 'Love Regenerator', 'Adam Richard Wiles'],
    genres: ['Dance Pop', 'Electro House', 'Nu-Disco'],
    portraitUrl: '',
    bio: 'Calvin Harris (Adam Richard Wiles) is a Scottish DJ, record producer, and singer-songwriter with dozens of worldwide #1 dance hits.',
  },
  {
    canonicalName: 'DJ Snake',
    realNames: ['William Grigahcine', 'William Sami Étienne Grigahcine'],
    spotifyNames: ['DJ Snake'],
    aliases: ['William Grigahcine', 'Snake', 'Turn Down for What', 'Let Me Love You'],
    genres: ['Trap', 'Moombahton', 'EDM'],
    portraitUrl: '',
    bio: 'DJ Snake (William Grigahcine) is a French music producer and DJ who achieved international acclaim with Turn Down for What, Lean On, and Taki Taki.',
  },
  {
    canonicalName: 'Skrillex',
    realNames: ['Sonny Moore', 'Sonny John Moore'],
    spotifyNames: ['Skrillex'],
    aliases: ['Sonny Moore', 'From First to Last', 'Sonny', 'Jack Ü'],
    genres: ['Dubstep', 'Bass Music', 'Electronic'],
    portraitUrl: '',
    bio: 'Skrillex (Sonny John Moore) is an American electronic music producer who spearheaded the global explosion of dubstep.',
  },
  {
    canonicalName: 'Martin Garrix',
    realNames: ['Martijn Garritsen', 'Martijn Gerard Garritsen'],
    spotifyNames: ['Martin Garrix'],
    aliases: ['Martijn Garritsen', 'YTRAM', 'GRX', 'Martijn'],
    genres: ['Progressive House', 'Big Room', 'EDM'],
    portraitUrl: '',
    bio: 'Martin Garrix (Martijn Gerard Garritsen) is a Dutch DJ and music producer ranked repeatedly as the world’s #1 DJ by DJ Mag.',
  },
  {
    canonicalName: 'BTS',
    realNames: ['Kim Namjoon', 'Kim Seokjin', 'Min Yoongi', 'Jung Hoseok', 'Park Jimin', 'Kim Taehyung', 'Jeon Jungkook'],
    spotifyNames: ['BTS'],
    aliases: ['Bangtan Boys', 'Bangtan Sonyeondan', 'RM', 'Suga', 'Agust D', 'J-Hope', 'Jimin', 'V', 'Jungkook', 'Jin'],
    genres: ['K-Pop', 'Pop', 'Hip Hop'],
    portraitUrl: '',
    bio: 'BTS (Bangtan Sonyeondan) is a South Korean boy band formed by Big Hit Entertainment that achieved unprecedented global superstardom.',
  },
  {
    canonicalName: 'BLACKPINK',
    realNames: ['Kim Ji-soo', 'Jennie Kim', 'Roseanne Park', 'Lalisa Manobal'],
    spotifyNames: ['BLACKPINK', 'Blackpink'],
    aliases: ['BP', 'Jennie', 'Jisoo', 'Lisa', 'Rosé', 'Rose', 'Blink'],
    genres: ['K-Pop', 'EDM Pop', 'Trap Pop'],
    portraitUrl: '',
    bio: 'BLACKPINK is a South Korean girl group known for high-energy pop anthems and fashion-forward global cultural impact.',
  },
  {
    canonicalName: 'IU',
    realNames: ['Lee Ji-eun', 'Lee Jieun'],
    spotifyNames: ['IU'],
    aliases: ['Lee Ji-eun', '이지은', '아이유', 'Jieun'],
    genres: ['K-Pop', 'Acoustic Pop', 'R&B'],
    portraitUrl: '',
    bio: 'IU (Lee Ji-eun) is one of South Korea\'s most successful and celebrated singer-songwriters and actresses.',
  },
];

/**
 * Fast lookup indexes for constant-time resolution
 */
const canonicalMap = new Map<string, ArtistAliasEntry>();
const normalizedAliasMap = new Map<string, ArtistAliasEntry>();

function indexDatabase() {
  for (const entry of ARTIST_ALIAS_DATABASE) {
    const cNorm = normalizeSearchString(entry.canonicalName);
    canonicalMap.set(cNorm, entry);

    const allNames = [
      entry.canonicalName,
      ...entry.realNames,
      ...entry.spotifyNames,
      ...entry.aliases,
    ];

    for (const name of allNames) {
      if (!name) continue;
      const norm = normalizeSearchString(name);
      if (norm) {
        normalizedAliasMap.set(norm, entry);
      }
      const clean = cleanSearchTitle(name);
      if (clean) {
        normalizedAliasMap.set(clean, entry);
      }
      // Index without spaces
      const noSpace = norm.replace(/\s+/g, '');
      if (noSpace) {
        normalizedAliasMap.set(noSpace, entry);
      }
    }
  }
}

indexDatabase();

// Precompute artist candidate names once at module load to avoid sorting 2000+ items on every resolveArtist call
const PRECOMPUTED_ARTIST_CANDIDATES: Array<{ name: string; nNorm: string; entry: ArtistAliasEntry }> = (() => {
  const candidates: Array<{ name: string; nNorm: string; entry: ArtistAliasEntry }> = [];
  for (const entry of ARTIST_ALIAS_DATABASE) {
    const candidateNames = [
      entry.canonicalName,
      ...entry.realNames,
      ...entry.spotifyNames,
      ...entry.aliases,
    ];
    for (const name of candidateNames) {
      const nNorm = normalizeSearchString(name);
      if (nNorm.length >= 3) {
        candidates.push({ name, nNorm, entry });
      }
    }
  }
  candidates.sort((a, b) => b.nNorm.length - a.nNorm.length);
  return candidates;
})();

// Fast memory caches for resolved artist identities and alias comparisons
const resolveArtistCache = new Map<string, ResolvedArtistMatch | null>();
const isArtistAliasMatchCache = new Map<string, boolean>();

export interface ResolvedArtistMatch {
  entry: ArtistAliasEntry;
  matchedName: string;
  matchType: 'canonical' | 'real_name' | 'spotify_name' | 'alias' | 'fuzzy' | 'combo';
  confidence: number;
  extractedSongTitle?: string;
}

/**
 * Returns all normalized alias/real/Spotiz names associated with an artist.
 */
export function getArtistAliasNames(artist: string): string[] {
  if (!artist || !artist.trim()) return [];
  const norm = normalizeSearchString(artist);
  const resolved = resolveArtist(norm);
  if (!resolved) return [norm];

  const names = new Set<string>();
  names.add(normalizeSearchString(resolved.entry.canonicalName));
  for (const n of resolved.entry.realNames) names.add(normalizeSearchString(n));
  for (const n of resolved.entry.spotifyNames) names.add(normalizeSearchString(n));
  for (const n of resolved.entry.aliases) names.add(normalizeSearchString(n));
  return Array.from(names).filter(Boolean);
}

/**
 * Resolves any artist query string (real name, Spotiz name, alias, or combination)
 * to its canonical artist identity and all associated aliases.
 */
function enrichEntry(entry: ArtistAliasEntry): ArtistAliasEntry {
  if (!entry.portraitUrl || entry.portraitUrl.includes('unsplash') || entry.portraitUrl.includes('placeholder')) {
    const portrait = getArtistPortrait(entry.canonicalName);
    if (portrait) {
      entry.portraitUrl = portrait;
    }
  }
  return entry;
}

export function resolveArtist(query: string): ResolvedArtistMatch | null {
  if (!query || !query.trim()) return null;

  const raw = query.trim();
  const norm = normalizeSearchString(raw);
  
  // Check memory cache first
  if (resolveArtistCache.has(norm)) {
    return resolveArtistCache.get(norm)!;
  }

  const clean = cleanSearchTitle(raw);
  const noSpace = norm.replace(/\s+/g, '');

  // 1. Direct Lookup via Normalized Alias Map
  let matched = normalizedAliasMap.get(norm) || normalizedAliasMap.get(clean) || normalizedAliasMap.get(noSpace);
  if (matched) {
    let matchType: ResolvedArtistMatch['matchType'] = 'alias';
    if (normalizeSearchString(matched.canonicalName) === norm) {
      matchType = 'canonical';
    } else if (matched.spotifyNames.some((sn) => normalizeSearchString(sn) === norm)) {
      matchType = 'spotify_name';
    } else if (matched.realNames.some((rn) => normalizeSearchString(rn) === norm)) {
      matchType = 'real_name';
    }

    const result: ResolvedArtistMatch = {
      entry: enrichEntry(matched),
      matchedName: raw,
      matchType,
      confidence: 1.0,
    };
    if (resolveArtistCache.size > 5000) resolveArtistCache.clear();
    resolveArtistCache.set(norm, result);
    return result;
  }

  // 2. Check for Artist + Song Combo (e.g. "Tere Bina High Born", "Tere Bina Taabish", "Abel Tesfaye Starboy", "Madhurxo Aarzu")
  const cleanSeparators = (str: string) =>
    str.replace(/^[-\s|/:,&]+|[-\s|/:,&]+$/g, '').replace(/^(by|feat|ft|featuring)\s+/i, '').replace(/\s+(by|feat|ft|featuring)$/i, '').trim();

  for (const { name, nNorm, entry } of PRECOMPUTED_ARTIST_CANDIDATES) {
    // Avoid false positives for generic single-word names (e.g., 'krishna' matching 'Jibon Krishna Das')
    const isMultiWordArtist = nNorm.includes(' ');
    const isCanonicalOrDistinct = nNorm === normalizeSearchString(entry.canonicalName) || nNorm.length >= 7;
    if (!isMultiWordArtist && !isCanonicalOrDistinct) {
      continue;
    }

    // Query ends with artist name (e.g. "Tere Bina High Born", "Tere Bina Taabish")
    if (norm.endsWith(' ' + nNorm) || norm.endsWith('-' + nNorm)) {
      const songPart = cleanSeparators(norm.slice(0, norm.length - nNorm.length));
      if (songPart.length >= 2) {
        const result: ResolvedArtistMatch = {
          entry: enrichEntry(entry),
          matchedName: name,
          matchType: 'combo',
          confidence: 0.95,
          extractedSongTitle: songPart,
        };
        if (resolveArtistCache.size > 5000) resolveArtistCache.clear();
        resolveArtistCache.set(norm, result);
        return result;
      }
    }

    // Query starts with artist name (e.g. "High Born Tere Bina", "Taabish Tere Bina")
    if (norm.startsWith(nNorm + ' ') || norm.startsWith(nNorm + '-')) {
      const songPart = cleanSeparators(norm.slice(nNorm.length));
      if (songPart.length >= 2) {
        const result: ResolvedArtistMatch = {
          entry: enrichEntry(entry),
          matchedName: name,
          matchType: 'combo',
          confidence: 0.95,
          extractedSongTitle: songPart,
        };
        if (resolveArtistCache.size > 5000) resolveArtistCache.clear();
        resolveArtistCache.set(norm, result);
        return result;
      }
    }

    // Query contains artist name surrounded by separators (e.g. "Tere Bina by High Born unplugged")
    if (isMultiWordArtist && norm.includes(' ' + nNorm + ' ')) {
      const songPart = cleanSeparators(norm.replace(' ' + nNorm + ' ', ' '));
      if (songPart.length >= 2) {
        const result: ResolvedArtistMatch = {
          entry: enrichEntry(entry),
          matchedName: name,
          matchType: 'combo',
          confidence: 0.92,
          extractedSongTitle: songPart,
        };
        if (resolveArtistCache.size > 5000) resolveArtistCache.clear();
        resolveArtistCache.set(norm, result);
        return result;
      }
    }
  }

  // 3. Algorithmic / Dynamic Spotiz Alias Variation (e.g. adding or removing 'xo', 'mc', 'dj', 'the', special punctuation)
  const deHandleNorm = norm
    .replace(/\b(xo|official|music|records|prod|dj|mc|the|dr|lil)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (deHandleNorm.length >= 3 && deHandleNorm !== norm) {
    matched = normalizedAliasMap.get(deHandleNorm);
    if (matched) {
      const result: ResolvedArtistMatch = {
        entry: enrichEntry(matched),
        matchedName: deHandleNorm,
        matchType: 'spotify_name',
        confidence: 0.9,
      };
      if (resolveArtistCache.size > 5000) resolveArtistCache.clear();
      resolveArtistCache.set(norm, result);
      return result;
    }
  }

  // 4. Fuzzy Similarity Search against all known artist names
  let bestSim = 0;
  let bestEntry: ArtistAliasEntry | null = null;
  let bestMatchedName = '';

  if (norm.length >= 4) {
    for (const { name, nNorm, entry } of PRECOMPUTED_ARTIST_CANDIDATES) {
      const sim = stringSimilarity(norm, nNorm);
      if (sim > bestSim && sim >= 0.82) {
        bestSim = sim;
        bestEntry = entry;
        bestMatchedName = name;
      }
    }
  }

  if (bestEntry) {
    const result: ResolvedArtistMatch = {
      entry: enrichEntry(bestEntry),
      matchedName: bestMatchedName,
      matchType: 'fuzzy',
      confidence: bestSim,
    };
    if (resolveArtistCache.size > 5000) resolveArtistCache.clear();
    resolveArtistCache.set(norm, result);
    return result;
  }

  if (resolveArtistCache.size > 5000) resolveArtistCache.clear();
  resolveArtistCache.set(norm, null);
  return null;
}

/**
 * Checks if two artist name strings refer to the same artist identity
 * (e.g. "Taabish" & "High Born" -> true, "The Weeknd" & "Abel Tesfaye" -> true, "Madhurxo" & "Madhur Sharma" -> true).
 */
export function isArtistAliasMatch(artistA: string, artistB: string): boolean {
  if (!artistA || !artistB) return false;

  const normA = normalizeSearchString(artistA);
  const normB = normalizeSearchString(artistB);

  if (normA === normB) return true;

  const pairKey = `${normA}:::${normB}`;
  if (isArtistAliasMatchCache.has(pairKey)) {
    return isArtistAliasMatchCache.get(pairKey)!;
  }

  const checkMatch = (): boolean => {
    const resA = resolveArtist(artistA);
    const resB = resolveArtist(artistB);

    if (resA && resB) {
      return normalizeSearchString(resA.entry.canonicalName) === normalizeSearchString(resB.entry.canonicalName);
    }

    if (resA) {
      const allNames = [
        resA.entry.canonicalName,
        ...resA.entry.realNames,
        ...resA.entry.spotifyNames,
        ...resA.entry.aliases,
      ].map((n) => normalizeSearchString(n));

      if (allNames.includes(normB)) return true;
    }

    if (resB) {
      const allNames = [
        resB.entry.canonicalName,
        ...resB.entry.realNames,
        ...resB.entry.spotifyNames,
        ...resB.entry.aliases,
      ].map((n) => normalizeSearchString(n));

      if (allNames.includes(normA)) return true;
    }

    // Check fuzzy algorithmic match if names are close
    if (normA.length >= 4 && normB.length >= 4) {
      const sim = stringSimilarity(normA, normB);
      if (sim >= 0.85) return true;
    }

    return false;
  };

  const isMatch = checkMatch();
  if (isArtistAliasMatchCache.size > 5000) isArtistAliasMatchCache.clear();
  isArtistAliasMatchCache.set(pairKey, isMatch);
  return isMatch;
}

/**
 * Generates an expanded set of search queries for upstream music providers (iTunes, Saavn, Deezer, Spotiz).
 * Guarantees that searching by real name, Spotiz moniker, or alias pulls all corresponding tracks and albums.
 */
export function getExpandedSearchQueries(query: string): string[] {
  const q = (query || '').trim();
  if (!q) return [];

  const queries = new Set<string>();
  queries.add(q);

  const resolved = resolveArtist(q);
  if (resolved) {
    const { entry, extractedSongTitle } = resolved;

    if (extractedSongTitle) {
      // User searched e.g. "Tere Bina High Born" -> generate "Tere Bina Taabish", "High Born Tere Bina", "Taabish Tere Bina", "Tere Bina"
      queries.add(`${entry.canonicalName} ${extractedSongTitle}`);
      queries.add(`${extractedSongTitle} ${entry.canonicalName}`);
      for (const sn of entry.spotifyNames) {
        queries.add(`${sn} ${extractedSongTitle}`);
        queries.add(`${extractedSongTitle} ${sn}`);
      }
      for (const rn of entry.realNames) {
        queries.add(`${rn} ${extractedSongTitle}`);
        queries.add(`${extractedSongTitle} ${rn}`);
      }
      queries.add(extractedSongTitle);
    } else {
      // User searched pure artist alias or real name
      queries.add(entry.canonicalName);
      for (const sn of entry.spotifyNames) {
        queries.add(sn);
      }
      for (const rn of entry.realNames) {
        queries.add(rn);
      }
      for (const al of entry.aliases.slice(0, 3)) {
        queries.add(al);
      }
    }
  }

  return Array.from(queries);
}
