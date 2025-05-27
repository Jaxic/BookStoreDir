// Default bookstore image showing a row of books on wooden shelves
export const DEFAULT_STORE_IMAGE = "/images/default-bookstore.jpg";

/**
 * Mapping of store names to their corresponding image filenames
 * This maps the store names from the CSV to the actual image files
 */
const STORE_IMAGE_MAP: Record<string, string> = {
  // Exact matches from CSV data
  'La petite bouquinerie': 'La_petite_bouquinerie.jpg',
  'Friends of the Ottawa Public Library': 'Friends_of_the_Ottawa_Public_Library.jpg',
  'Librairie Vincent Legendre': 'Librairie_Vincent_Legendre.jpg',
  'Country Life Books': 'Country_Life_Books.jpg',
  'Bellwoods Books': 'Bellwoods_Books.jpg',
  'JMC books': 'JMC_books.jpg',
  'Faustroll et fils, disques fins et livres choisis': 'Faustroll_et_fils_disques_fins_et_livres_choisis.jpg',
  'SG Livres Usagés': 'SG_Livres_Usages.jpg',
  'Librairie Le Chat Lit': 'Librairie_Le_Chat_Lit.jpg',
  'Well Read Books': 'Well_Read_Books.jpg',
  'Nikkei Japanese Bookstore': 'Nikkei_Japanese_Bookstore.jpg',
  'Second Chance Reads': 'Second_Chance_Reads.jpg',
  'Reeve & Clarke Books ( ABAC / ILAB )': 'Reeve_Clarke_Books_ABAC_ILAB.jpg',
  'Minotavros Books': 'Minotavros_Books.jpg',
  'librairie vilsy': 'librairie_vilsy.jpg',
  'Contact Editions Inc': 'Contact_Editions_Inc.jpg',
  'Bjarne Tokerud Bookseller Inc.': 'Bjarne_Tokerud_Bookseller_Inc.jpg',
  'Attica Mea Used Books': 'Attica_Mea_Used_Books.jpg',
  'Les trois boucs': 'Les_trois_boucs.jpg',
  'Hidden Treasures': 'Hidden_Treasures.jpg',
  'Grenville\'s Books & Art': 'Grenvilles_Books_Art.jpg',
  'Lire à rabais': 'Lire_a_rabais.jpg',
  'CornerHouse Books': 'CornerHouse_Books.jpg',
  'B.D. Livres Anciens': 'BD_Livres_Anciens.jpg',
  'Cherished Books': 'Cherished_Books.jpg',
  'Geoffrey Cates Books': 'Geoffrey_Cates_Books.jpg',
  'OakTree Free Book Exchange': 'OakTree_Free_Book_Exchange.jpg',
  'Patty\'s Book Room': 'Pattys_Book_Room.jpg',
  'Second Editions': 'Second_Editions.jpg',
  'Bouquinerie 4 Saisons': 'Bouquinerie_4_Saisons.jpg',
  'CAVITY Curiosity Shop': 'CAVITY_Curiosity_Shop.jpg',
  'Bookends (original)': 'Bookends.jpg',
  'Juniper Books': 'Juniper_Books.jpg',
  'The Printed Word': 'The_Printed_Word.jpg',
  'The Scribe Bookstore': 'The_Scribe_Bookstore.jpg',
  'The Odd Book': 'The_Odd_Book.jpg',
  'Red Cart Books': 'Red_Cart_Books.jpg',
  'Peryton Books': 'Peryton_Books.jpg',
  'Les Mots Passants Inc.': 'Les_Mots_Passants_Inc.jpg',
  'Kingfisher Quality Used Books': 'Kingfisher_Quality_Used_Books.jpg',
  'Hollywood Canteen': 'Hollywood_Canteen.jpg',
  'Bearly Used Books': 'Bearly_Used_Books.jpg',
  'TORN PAGES': 'TORN_PAGES.jpg',
  'Literacy Quesnel Society': 'Literacy_Quesnel_Society.jpg',
  'The River Trading Company': 'The_River_Trading_Company.jpg',
  'By the Books PTBO': 'By_the_Books_PTBO.jpg',
  'Nuggets Used Books': 'Nuggets_Used_Books.jpg',
  'Book Lovers': 'Book_Lovers.jpg',
  'Forest Books & Media': 'Forest_Books_Media.jpg',
  'Bookcase The': 'Bookcase_The.jpg',
  
  // Additional mappings based on actual image files in StoreImages directory
  'TimelessLegacy': 'TimelessLegacy.jpg',
  'Susan\'s moving sale': 'Susans_moving_sale.jpg',
  'Rising Trout Sporting Books': 'Rising_Trout_Sporting_Books.jpg',
  'Paper Chase Antiques': 'Paper_Chase_Antiques.jpg',
  'Old Crow Antique Book Shoppe Ltd.': 'Old_Crow_Antique_Book_Shoppe_Ltd.jpg',
  'Mind Finds Used Books': 'Mind_Finds_Used_Books.jpg',
  'MarilynKDP': 'MarilynKDP.jpg',
  'Marie Livres': 'Marie_Livres.jpg',
  'Mapguru - Vintage Maps': 'Mapguru_-_Vintage_Maps.jpg',
  'E-Book Store': 'E-Book_Store.jpg',
  'David\'s New and Used Books': 'Davids_New_and_Used_Books.jpg',
  'Caron Canadiana': 'Caron_Canadiana.jpg',
  'Bound by Emmy': 'Bound_by_Emmy.jpg',
  'Boîte à livres 1': 'Boîte_à_livres_1.jpg',
  'Best Balance Planner': 'Best_Balance_Planner.jpg',
  'Ainsworth Books': 'Ainsworth_Books.jpg',
  'Friends of the Library Bookstore': 'Friends_of_the_Library_Bookstore_1.jpg',
  'The Book Cellar': 'The_Book_Cellar.jpg',
  'Ursalope - eBay Store': 'Ursalope_-_eBay_Store.jpg',
  'LIBRAIRIE RIVE SUD': 'LIBRAIRIE_RIVE_SUD.jpg',
  'Chapter 2 Used Books': 'Chapter_2_Used_Books.jpg',
  'BOOKEnds South': 'BOOKEnds_South.jpg',
  'MaVieOptimisee.com': 'MaVieOptimisee.com.jpg',
  'Boite à livres': 'Boite_à_livres.jpg',
  'Precision Outdoor Power Books': 'Precision_Outdoor_Power_Books.jpg',
  'Theatre of the Mind Books': 'Theatre_of_the_Mind_Books.jpg',
  'Outsider Enterprises': 'Outsider_Enterprises.jpg',
  'John W. Doull, Bookseller': 'John_W._Doull_Bookseller.jpg',
  'Friends of the London Library Bookstore': 'Friends_of_the_London_Library_Bookstore.jpg',
  'D E Lake Ltd': 'D_E_Lake_Ltd.jpg',
  'Librairie Renaissance Terrebonne': 'Librairie_Renaissance_Terrebonne.jpg',
  'SUBtext Books UVic': 'SUBtext_Books_UVic.jpg',
  'The Friends Bookshop': 'The_Friends_Bookshop.jpg',
  'Used Jewish Books': 'Used_Jewish_Books.jpg',
  'Renaissance Librairie Forsyth': 'Renaissance_Librairie_Forsyth.jpg',
  'Give it Again Gifts': 'Give_it_Again_Gifts.jpg',
  'Le Coin Du Savoir': 'Le_Coin_Du_Savoir.jpg',
  'Relire Livres': 'Relire_Livres.jpg',
  'Librairie Renaissance Bombardier': 'Librairie_Renaissance_Bombardier.jpg',
  'La Forêt des livres Librairie en ligne': 'La_Forêt_des_livres_Librairie_en_ligne.jpg',
  'Auger Roger Libraire Enr': 'Auger_Roger_Libraire_Enr.jpg',
  'Library Center of Don Renaissance Pierrefonds': 'Library_Center_of_Don_Renaissance_Pierrefonds.jpg',
  'Bande Dessinerie Enr La': 'Bande_Dessinerie_Enr_La.jpg',
  'Lire Et Relire': 'Lire_Et_Relire_1.jpg',
  'The Bookman': 'The_Bookman.jpg',
  'Capricorn Books': 'Capricorn_Books.jpg',
  'Amy\'s Used Books': 'Amys_Used_Books.jpg',
  'Librairie Icitte': 'Librairie_Icitte.jpg',
  'Scene Of The Crime Books': 'Scene_Of_The_Crime_Books.jpg',
  'Yann Vernay libraire': 'Yann_Vernay_libraire.jpg',
  'Charlie Bouquine': 'Charlie_Bouquine.jpg',
  'Zoinks Music and Books': 'Zoinks_Music_and_Books.jpg',
  'Comptoir du Livre Enr': 'Comptoir_du_Livre_Enr.jpg',
  'Gritty Grotto Books': 'Gritty_Grotto_Books.jpg',
  'Renaissance Bookstore-Donation Centre': 'Renaissance_Bookstore-Donation_Centre.jpg',
  'Chapter and Verse': 'Chapter_and_Verse.jpg',
  'Phoenix Book Store': 'Phoenix_Book_Store.jpg',
  'Lire et Relire': 'Lire_et_Relire.jpg',
  'Mark Jokinen Books': 'Mark_Jokinen_Books.jpg',
  'Librairie l\'Échange': 'Librairie_lÉchange.jpg',
  'Librairie-en-Ligne': 'Librairie-en-Ligne.jpg',
  'Renaissance Librairie Saint-Denis': 'Renaissance_Librairie_Saint-Denis.jpg',
  'Renaissance Don Faubourg des Prairies': 'Renaissance_Don_Faubourg_des_Prairies.jpg',
  'Lawrence Books': 'Lawrence_Books.jpg',
  'Librairie De La Montee': 'Librairie_De_La_Montee.jpg',
  'Echo Books': 'Echo_Books.jpg',
  'Pulpfiction Books': 'Pulpfiction_Books.jpg',
  'Orleans Book Market': 'Orleans_Book_Market.jpg',
  'Cardinal Books': 'Cardinal_Books.jpg',
  'Renaissance Librairie Fleury-Hamel': 'Renaissance_Librairie_Fleury-Hamel.jpg',
  'Cultures A Partager': 'Cultures_A_Partager.jpg',
  'Knotanew Book Store': 'Knotanew_Book_Store.jpg',
  'Andrena\'s Book Company': 'Andrenas_Book_Company.jpg',
  'Watson\'s Mill Used Book Store': 'Watsons_Mill_Used_Book_Store.jpg',
  'Librairie Bonheur D\'Occasion Inc': 'Librairie_Bonheur_DOccasion_Inc.jpg',
  'Bestsellers Bookstore': 'Bestsellers_Bookstore.jpg',
  'Berry Peterson Booksellers': 'Berry_Peterson_Booksellers.jpg',
  'au Lieu du Livre': 'au_Lieu_du_Livre.jpg',
  'Book Bazaar': 'Book_Bazaar.jpg',
  'The Bookworm': 'The_Bookworm.jpg',
  'Bookends 1': 'Bookends_1.jpg',
  'Librairie Nelligan Inc': 'Librairie_Nelligan_Inc.jpg',
  'Renaissance Librairie Ontario': 'Renaissance_Librairie_Ontario.jpg',
  'Second Edition Used Book Store': 'Second_Edition_Used_Book_Store.jpg',
  'Book Cellar The': 'Book_Cellar_The.jpg',
  'Readers Haven': 'Readers_Haven.jpg',
  'The Book Bin': 'The_Book_Bin.jpg',
  'Best Choice Quality Used Books': 'Best_Choice_Quality_Used_Books.jpg',
  'Pandosy Books': 'Pandosy_Books.jpg',
  'MacLeod\'s Books': 'MacLeods_Books.jpg',
  'Les Trésors du futur librairie de livres usagés St-Hyacinthe': 'Les_Trésors_du_futur_librairie_de_livres_usagés_St-Hyacinthe.jpg',
  'Volume Boutique Inc': 'Volume_Boutique_Inc.jpg',
  'Paraphernalia Books N Stuff': 'Paraphernalia_Books_N_Stuff.jpg',
  'Selkirk Book Exchange': 'Selkirk_Book_Exchange.jpg',
  'ABC Antiques Books & Collectibles': 'ABC_Antiques_Books_Collectibles.jpg',
  'Bison Books': 'Bison_Books.jpg',
  'Cover To Cover Books Inc': 'Cover_To_Cover_Books_Inc.jpg',
  'Legends Used Books': 'Legends_Used_Books.jpg',
  'Bookmart': 'Bookmart.jpg',
  'Librairie L\'Occasion': 'Librairie_LOccasion.jpg',
  
  // Additional mappings for stores that have image files
  'Alhambra Books': 'Alhambra_Books.jpg',
  'Antiquarius': 'Antiquarius.jpg',
  'Acadia Art & Rare Books - Est 1931': 'Acadia_Art_Rare_Books_-_Est_1931.jpg',
  'Agricola Street Books': 'Agricola_Street_Books.jpg',
  'Alfsen House Books': 'Alfsen_House_Books.jpg',
  'ALLISON THE BOOKMAN': 'ALLISON_THE_BOOKMAN.jpg',
  'Arbutus Quality Used Books': 'Arbutus_Quality_Used_Books.jpg',
  'Atelier-Librairie Le Livre voyageur': 'Atelier-Librairie_Le_Livre_voyageur.jpg',
  'BackPages Books': 'BackPages_Books.jpg',
  'Bent Trees Books': 'Bent_Trees_Books.jpg',
  'Bookends (Toronto)': 'Bookends.jpg',
  'Books & Things': 'Books_Things.jpg',
  'Books On The Grand': 'Books_On_The_Grand.jpg',
  'Borealis Books': 'Borealis_Books.jpg',
  'Boutique aux livres anciens (le marchant de feuilles)': 'Boutique_aux_livres_anciens_le_marchant_de_feuilles.jpg',
  'Brighton Books': 'Brighton_Books.jpg',
  'Britton Books': 'Britton_Books.jpg',
  'Carrefour des Livres': 'Carrefour_des_Livres.jpg',
  'Catherine Mitchell Antique Maps': 'Catherine_Mitchell_Antique_Maps.jpg',
  'Chatham-Kent Book Exchange': 'Chatham-Kent_Book_Exchange.jpg',
  'Cheap Thrills Records and Books': 'Cheap_Thrills_Records_and_Books.jpg',
  'Classic Bookshop': 'Classic_Bookshop.jpg',
  'Daniadown Books': 'Daniadown_Books.jpg',
  'De la Page écrite': 'De_la_Page_écrite.jpg',
  'Deer Park United Church Book Sale': 'Deer_Park_United_Church_Book_Sale.jpg',
  'Dunbar Books': 'Dunbar_Books.jpg',
  'Griff\'s Comics': 'Griffs_Comics.jpg',
  'Houle Jean-Marie livres rares': 'Houle_Jean-Marie_livres_rares.jpg',
  'J. Patrick McGahern Books Inc.': 'J._Patrick_McGahern_Books_Inc.jpg',
  'Jamie\'s Treasure Trove': 'Jamies_Treasure_Trove.jpg',
  'Janus Books': 'Janus_Books.jpg',
  'Kelley & Associates Rare Books': 'Kelley_Associates_Rare_Books.jpg',
  'Librairie A to Z': 'Librairie_A_to_Z.jpg',
  'Librairie Alpha': 'Librairie_Alpha.jpg',
  'Librairie Aux deux etages inc.': 'Librairie_Aux_deux_etages_inc.jpg',
  'Librairie bibliomania': 'Librairie_bibliomania.jpg',
  'Librairie générale française': 'Librairie_générale_française.jpg',
  'Librairie Les Rayons du Savoir': 'Librairie_Les_Rayons_du_Savoir.jpg',
  'Librairie Médiaspaul': 'Librairie_Médiaspaul.jpg',
  'Librairie Michelle Houle-Lachance': 'Librairie_Michelle_Houle-Lachance.jpg',
  'Librairie Père Delorme': 'Librairie_Père_Delorme.jpg',
  'Librairie Pour Tous': 'Librairie_Pour_Tous.jpg',
  'Librairie Raffin': 'Librairie_Raffin.jpg',
  'New Friends Book Shop': 'New_Friends_Book_Shop.jpg',
  'Nicolas Malais - Libraire Antiquaire': 'Nicolas_Malais_-_Libraire_Antiquaire.jpg',
  'Pickwick Books': 'Pickwick_Books.jpg',
  'Porcupine\'s Quill': 'Porcupines_Quill.jpg',
  'Pêle-Mêle Livres': 'Pêle-Mêle_Livres.jpg',
  'Re-Read Books': 'Re-Read_Books.jpg',
  'Recycled Reading': 'Recycled_Reading.jpg',
  'Russell Books Ltd': 'Russell_Books_Ltd.jpg',
  'Safari Books': 'Safari_Books.jpg',
  'Seekers Books & Coffee': 'Seekers_Books_Coffee.jpg',
  'Talisman Books and Gallery': 'Talisman_Books_and_Gallery.jpg',
  'The Book Exchange': 'The_Book_Exchange.jpg',
  'The Book Gallery': 'The_Book_Gallery.jpg',
  'The BookShelf': 'The_BookShelf.jpg',
  'The Reading Garden': 'The_Reading_Garden.jpg',
  'Ulysses Travel Bookshop': 'Ulysses_Travel_Bookshop.jpg',
  'What the Dickens Books & Curios': 'What_the_Dickens_Books_Curios.jpg',
  'Wonder\'s Books': 'Wonders_Books.jpg',
  'Wee Book Inn': 'Wee_Book_Inn.jpg',
  
  // Comprehensive mappings for all stores with available images (Part 1)
  'Castaway Used Books (Nearly New Books)': 'Castaway_Used_Books_Nearly_New_Books.jpg',
  'Dartmouth Book Exchange': 'Dartmouth_Book_Exchange.jpg',
  'Companion Books': 'Companion_Books.jpg',
  'Boutique Livres et Trésors': 'Boutique_Livres_et_Trésors.jpg',
  'Well-Read Books': 'Well_Read_Books.jpg',
  'SEPHYR - Les livres de l\'Espoir': 'SEPHYR_-_Les_livres_de_lEspoir.jpg',
  'Re-Read Used Books': 'Re-Read_Used_Books.jpg',
  'The Monkey\'s Paw': 'The_Monkeys_Paw.jpg',
  'Librairie La Cargaison': 'Librairie_La_Cargaison.jpg',
  'Karol Krysik Books': 'Karol_Krysik_Books.jpg',
  'Williamsford Mill': 'Williamsford_Mill.jpg',
  'Fiona\'s Book Corner': 'Fionas_Book_Corner.jpg',
  'Doug Miller Books': 'Doug_Miller_Books.jpg',
  'Book Brothers The': 'Book_Brothers_The.jpg',
  'The Purple Platypus': 'The_Purple_Platypus.jpg',
  'Squamish Community Bookstore': 'Squamish_Community_Bookstore.jpg',
  'The Paper Hound Bookshop': 'The_Paper_Hound_Bookshop.jpg',
  'Nearly New Books': 'Nearly_New_Books.jpg',
  'Librairie Librissime': 'Librairie_Librissime.jpg',
  'Comptoir FAÉCUM Roger-Gaudry - Kiosque de livres usagés (KLU)': 'Comptoir_FAÉCUM_Roger-Gaudry_-_Kiosque_de_livres_usagés_KLU.jpg',
  'Kestrel Books': 'Kestrel_Books.jpg',
  'Phoenix Books': 'Phoenix_Books.jpg',
  'Great Escape Book Store': 'Great_Escape_Book_Store.jpg',
  'E.C. Rare Books': 'E.C._Rare_Books.jpg',
  'Blind Forest Books & Novelties': 'Blind_Forest_Books_Novelties.jpg',
  'Lu et relu': 'Lu_et_relu.jpg',
  'Carson Books & Records': 'Carson_Books_Records.jpg',
  'Ed\'s Books & More': 'Eds_Books_More.jpg',
  'Fernlea Ivix Non Profit Used Books': 'Fernlea_Ivix_Non_Profit_Used_Books.jpg',
  'The Book Place': 'The_Book_Place.jpg',
  'Librairie Laforce': 'Librairie_Laforce.jpg',
  'The Smart Bookshop': 'The_Smart_Bookshop.jpg',
  'Librairie St-Germain': 'Librairie_St-Germain.jpg',
  'Renaissance Libraire L\'Île-Perrot': 'Renaissance_Libraire_LÎle-Perrot.jpg',
  'Ordi Livres Signes D\'Espoir': 'Ordi_Livres_Signes_DEspoir.jpg',
  'Centre du Livre Usagé': 'Centre_du_Livre_Usagé.jpg',
  'By the Book': 'By_the_Book.jpg',
  'The Skeleton Key Used Bookstore': 'The_Skeleton_Key_Used_Bookstore.jpg',
  'Bouquinerie Rock\'n livre': 'Bouquinerie_Rockn_livre.jpg',
  'Librairie Saint-Jean-Baptiste': 'Librairie_Saint-Jean-Baptiste.jpg',
  'Au Tourne-Livre': 'Au_Tourne-Livre.jpg',
  'David Mason Books': 'David_Mason_Books.jpg',
  'Brown & Dickson Bookstore': 'Brown_Dickson_Bookstore.jpg',
  'The Haunted Bookshop': 'The_Haunted_Bookshop.jpg',
  'Bouquinerie A Dede': 'Bouquinerie_A_Dede.jpg',
  'Baker\'s Books': 'Bakers_Books.jpg',
  'Westgate Books Inc': 'Westgate_Books_Inc.jpg',
  'Ted\'s Paperback': 'Teds_Paperback.jpg',
  'Bridgeburg Books and Games': 'Bridgeburg_Books_and_Games.jpg',
  'Les Trésors du Futur inc.': 'Les_Trésors_du_Futur_inc.jpg',
  'Schooner Books Ltd.': 'Schooner_Books_Ltd.jpg',
  'Rivendell Books': 'Rivendell_Books.jpg',
  'Re: Reading Used Books': 'Re_Reading_Used_Books.jpg',
  'Librairie D\'occasion': 'Librairie_Doccasion.jpg',
  'Globosapiens Used Bookstore': 'Globosapiens_Used_Bookstore.jpg',
  'KW Bookstore': 'KW_Bookstore.jpg',
  'Encore Books & Records': 'Encore_Books_Records.jpg',
  'Écolivres': 'Écolivres.jpg',
  'The Bookery': 'The_Bookery.jpg',
  'Word (The)': 'Word_The.jpg',
  'Book Addict': 'Book_Addict.jpg',
  'Readers\' Choice': 'Readers_Choice.jpg',
  'N2N Books': 'N2N_Books.jpg',
  'Loyalist City Coins & Books': 'Loyalist_City_Coins_Books.jpg',
  'The Edmonton Book Store': 'The_Edmonton_Book_Store.jpg',
  'The Bookcase Co': 'The_Bookcase_Co.jpg',
  'A Good Read': 'A_Good_Read.jpg',
  'Big John\'s Books': 'Big_Johns_Books.jpg',
  'Librairie La Feuille Enchantee': 'Librairie_La_Feuille_Enchantee.jpg',
  'Elaine\'s Books': 'Elaines_Books.jpg',
  'Westcott Books': 'Westcott_Books.jpg',
  'Cote Gauche Book store': 'Cote_Gauche_Book_store.jpg',
  'Barely Bent Used Books': 'Barely_Bent_Used_Books.jpg',
  'The Reading Room Bookstore': 'The_Reading_Room_Bookstore.jpg',
  'Page One Used Books': 'Page_One_Used_Books.jpg',
  'Salamander Books': 'Salamander_Books.jpg',
  'Ten Old Books': 'Ten_Old_Books.jpg',
  'Ctr Books': 'Ctr_Books.jpg',
  'Elizabeth\'s Books': 'Elizabeths_Books.jpg',
  'Librairie Historia Enr': 'Librairie_Historia_Enr.jpg',
  'Second Story Books': 'Second_Story_Books.jpg',
  'Black Cat Books': 'Black_Cat_Books.jpg',
  'Librairie Renaissance Notre-Dame-de-Grâce': 'Librairie_Renaissance_Notre-Dame-de-Grâce.jpg',
  'Renaissance Librairie Beaumont': 'Renaissance_Librairie_Beaumont.jpg',
  'Second Page Used Books': 'Second_Page_Used_Books.jpg',
  'Cornucopia': 'Cornucopia.jpg',
  'Books Galore': 'Books_Galore.jpg',
  'Blue Griffin Books': 'Blue_Griffin_Books.jpg',
  'The Bookstore': 'The_Bookstore.jpg',
  'SPCA Bookstore': 'SPCA_Bookstore.jpg',
  'The Owl Pen': 'The_Owl_Pen.jpg',
  'Bouquinerie Nouvelle Chance': 'Bouquinerie_Nouvelle_Chance.jpg',
  'Collection Normand Leduc': 'Collection_Normand_Leduc.jpg',
  'The Next Chapter': 'The_Next_Chapter.jpg',
  'The Bookseller': 'The_Bookseller.jpg',
  'Scheherazade Books & Music': 'Scheherazade_Books_Music.jpg',
  'The Sherwood Park Bookworm': 'The_Sherwood_Park_Bookworm.jpg',
  'ABC: Antiques, Books & Collectibles': 'ABC_Antiques_Books_Collectibles.jpg',
  'Paraphernalia Books \'N\' Stuff': 'Paraphernalia_Books_N_Stuff.jpg',
  'Les Trésors du futur, librairie de livres usagés St-Hyacinthe': 'Les_Trésors_du_futur_librairie_de_livres_usagés_St-Hyacinthe.jpg',
  'Reader\'s Haven': 'Readers_Haven.jpg',
  'Berry & Peterson Booksellers': 'Berry_Peterson_Booksellers.jpg',
  'Bande Dessinerie Enr (La)': 'Bande_Dessinerie_Enr_La.jpg',
  'La Forêt des livres | Librairie en ligne': 'La_Forêt_des_livres_Librairie_en_ligne.jpg',
  'The Friends\' Bookshop': 'The_Friends_Bookshop.jpg',
  'D & E Lake Ltd.': 'D_E_Lake_Ltd.jpg',
  'Book box À Lire aux Pays des Merveilles': 'Book_box_À_Lire_aux_Pays_des_Merveilles.jpg',
  'Book Store': 'Book_Store.jpg',
  'Celine\'s Books and Beauty': 'Celines_Books_and_Beauty.jpg',
  'David\'s New and Used Books': 'Davids_New_and_Used_Books.jpg',
  'Dhear Black Gurl': 'Dhear_Black_Gurl.jpg',
  'Old Crow Antique & Book Shoppe Ltd.': 'Old_Crow_Antique_Book_Shoppe_Ltd.jpg',
  'Susan\'s moving sale': 'Susans_moving_sale.jpg',
  'Tomes & Trivia': 'Tomes_Trivia.jpg'
};

/**
 * Normalize store name for matching (remove spaces, punctuation, convert to lowercase)
 */
function normalizeStoreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Find the best matching image for a store name using fuzzy matching
 */
function findBestImageMatch(storeName: string): string | null {
  // Try exact match first
  if (STORE_IMAGE_MAP[storeName]) {
    return STORE_IMAGE_MAP[storeName];
  }

  // Try normalized matching
  const normalizedInput = normalizeStoreName(storeName);
  
  for (const [mapName, imageName] of Object.entries(STORE_IMAGE_MAP)) {
    const normalizedMapName = normalizeStoreName(mapName);
    if (normalizedMapName === normalizedInput) {
      return imageName;
    }
  }

  // Try partial matching (if store name contains or is contained in mapped name)
  for (const [mapName, imageName] of Object.entries(STORE_IMAGE_MAP)) {
    const normalizedMapName = normalizeStoreName(mapName);
    if (normalizedMapName.includes(normalizedInput) || normalizedInput.includes(normalizedMapName)) {
      return imageName;
    }
  }

  return null;
}

/**
 * Get store image URL based on store name
 */
export function getStoreImageByName(storeName: string): string {
  const imageFilename = findBestImageMatch(storeName);
  
  if (imageFilename) {
    return `/images/StoreImages/${imageFilename}`;
  }
  
  // Return a curated fallback image if no match found
  return getFallbackImage(storeName);
}

/**
 * Get a curated fallback image based on store name or type
 */
function getFallbackImage(storeName: string = ''): string {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center&auto=format&q=80', // Classic bookstore
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center&auto=format&q=80', // Cozy reading corner
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop&crop=center&auto=format&q=80', // Old books
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&crop=center&auto=format&q=80', // Library shelves
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop&crop=center&auto=format&q=80'  // Open book
  ];
  
  // Use store name to determine a consistent fallback
  const hash = storeName.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  const index = Math.abs(hash) % fallbackImages.length;
  
  return fallbackImages[index];
}

/**
 * Get multiple fallback images for progressive loading
 */
export function getImageFallbacks(photosUrl?: string, storeName?: string): string[] {
  const fallbacks: string[] = [];
  
  // If we have a store name, try to get the specific store image first
  if (storeName) {
    const storeImage = getStoreImageByName(storeName);
    fallbacks.push(storeImage);
  }
  
  // Add Google Photos URL as secondary fallback (though likely won't work)
  if (photosUrl && photosUrl.trim() !== '') {
    fallbacks.push(photosUrl);
  }
  
  // Add generic fallback images
  fallbacks.push(getFallbackImage(storeName || 'default'));
  
  // Add final fallback
  fallbacks.push('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center&auto=format&q=80');
  
  // Remove duplicates while preserving order
  return [...new Set(fallbacks)];
}

/**
 * Legacy function for backward compatibility
 */
export function getStoreImage(photosUrl?: string): string {
  return getImageFallbacks(photosUrl)[0];
} 