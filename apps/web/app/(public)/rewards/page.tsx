import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Gift, Mail, Smartphone, Clock3, Star, Users, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Earn Prezzee Gift Cards | TradeRefer Rewards",
    description: "Invite 5 people to TradeRefer and automatically earn a $25 Prezzee Smart Card — spend it at Woolworths, Bunnings, Uber, Netflix, Coles and 400+ more brands.",
};

const PREZZEE_LOGO = "https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg";

const BASE = "https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7";

const PREZZEE_SMART_GIF = `${BASE}/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif`;

const CARDS = [
    { name: "Prezzee Smart Card", url: PREZZEE_SMART_GIF },
    { name: "Groceries", url: `${BASE}/e1ffa9be-102f-427c-b96d-4bcfe883f1e3/AU_Prezzee_Groceries_SKU_452_280.png` },
    { name: "Luxury", url: `${BASE}/9513c78c-2e6e-48a3-8db4-8f18fe3541ad/Prezzee_Luxury_Category_SKU_Updated_29725_452_280.png` },
    { name: "Ampol", url: `${BASE}/70ecca42-5ca9-45b3-9bb4-69f3413d95bf/ampol_gc_452_280.jpg` },
    { name: "lululemon", url: `${BASE}/dca3aea1-015e-4cbc-96a8-6aa6c69b018b/lululemon__AU__Gift_Card_Image_452_280.jpg` },
    { name: "PUMA", url: `${BASE}/961b313f-07e1-4321-9495-b19a687ba1b5/PUMA__AU__Gift_Card_Image_452_280.jpg` },
    { name: "Ripcurl", url: `${BASE}/8350baaa-0544-4aab-a8f4-8c3d8c8a7def/Ripcurl_AU_Gift_Card_Image_452_280.jpg` },
    { name: "Stinger Golf", url: `${BASE}/90a8c864-a3d9-41fa-b8e0-ab42b2ad01a2/Stinger_Golf_AU_GC_Image_2025_452_280.jpg` },
    { name: "Lunar New Year", url: `${BASE}/a3c3e7e5-e48d-44f3-8617-cf0907a7cad7/20260109-campaign-lunarnewyear-sku-01-452x280px_452_280.gif` },
    { name: "Lantern Festival", url: `${BASE}/e3d83c90-e427-4113-8c09-da51da024a61/20260109-campaign-lunarnewyear-sku-02-452x280px_452_280.gif` },
    { name: "Let's Party", url: `${BASE}/48bba655-b822-4fb9-a179-e689e416852d/Cheers_to_us_%282%29_452_280.png` },
    { name: "New Adventures", url: `${BASE}/c606d0f8-3219-49b0-b477-45321f342ab6/Let_s_get_lost_%281%29_452_280.png` },
    { name: "Self Care", url: `${BASE}/cd3dea17-a65d-472a-bdcc-d536a6ab5b80/Self_care_%281%29_452_280.png` },
    { name: "Happy Birthday", url: `${BASE}/cdd5a783-03c4-4dc1-99bb-d38611f4beea/Happy_Birthday_-_452x280_452_280.png` },
    { name: "Wedding", url: `${BASE}/74d68461-0fc9-44d9-b8c6-eca8a6c81e4a/wedding_prezzee_001_452_280.png` },
    { name: "For Her", url: `${BASE}/3ee8ccc0-24cc-4de1-a17d-3d9e98aa2cf7/NZ_Prezzee_Her_Category_SKU_452_280.png` },
    { name: "For Him", url: `${BASE}/24b8f9e1-d3e4-4a6d-a76f-15c9eaa8b623/Prezzee_for_Him_SKU_2026_452_280.png` },
    { name: "For Kids", url: `${BASE}/755871ce-bc4c-4509-a571-4e4f8992422c/Prezzee_Kids_452_280.png` },
    { name: "Foodie", url: `${BASE}/18ceb08f-a6ea-4676-80e0-a4044a0647c0/AU_Prezzee_Foodie_452_280.png` },
    { name: "Fuel", url: `${BASE}/8375906a-b45f-4acc-8c1e-019a2df55842/Prezzee_Fuel_Category_452_280.png` },
    { name: "Entertainment", url: `${BASE}/91f8ddc2-9f41-47dd-b657-aef3dadb89f6/Prezzee_Entertainment_SKU_452_280.png` },
    { name: "Travel", url: `${BASE}/0517fd0a-e366-41f1-9a10-567eb7b4e698/Prezzee_Travel_SKU_452_280.png` },
    { name: "Well Done!", url: `${BASE}/e4b8ace6-5f59-4dff-9ea8-61f8b95d9d24/Well_done_SKU_452_280.png` },
    { name: "World's Best Teacher", url: `${BASE}/dfccf25a-6508-4bb8-9374-0a5d7f0ff9e9/20240805-worldteacherday-SKU_452_280.png` },
    { name: "School Graduation", url: `${BASE}/aa8599a4-308f-4831-a9f6-3e4e041ea231/Primary_School_Graduation_SKU_(1)_452_280.png` },
    // ── Verified brand cards (A–F) from Prezzee React Query cache ──
    { name: "Accor Hotels", url: `${BASE}/ee57055b-b8e8-40cf-97dc-5605c8cc2b2e/ACCOR_HOTELS_AUD_452_280.jpg` },
    { name: "Adina Hotels", url: `${BASE}/596d078e-27da-4640-b89d-64d7feb4beeb/ADINA_HOTELS_AUD_452_280.png` },
    { name: "Adore Beauty", url: `${BASE}/463fa687-6cb0-486f-af47-a5a983230530/Adore_Beauty_GC_Image_452_280.png` },
    { name: "Adrenaline", url: `${BASE}/4015be12-710b-4fe4-9b81-267e7b3ff5b6/adrenaline_gc_452_280.jpg` },
    { name: "Aesop", url: `${BASE}/e2e08a45-a21b-4559-9265-df2225e65813/Aesop_452_280.png` },
    { name: "ALINKA Fine Jewellery", url: `${BASE}/31b1abae-7ad3-4136-9c41-f45e8361cbd3/Alinka_Fine_Jewellery_Global_Gift_Card_Image_452_280.png` },
    { name: "Amanda's On The Edge", url: `${BASE}/22f9b1fa-5423-4e69-b6f9-80da9794bad2/Amanda%27s_On_The_Edge_GC_452_280.jpg` },
    { name: "Amart Furniture", url: `${BASE}/e6f80bbc-523a-4514-9e77-ce7a5ca9537a/AMART_FURNITURE_02_452_280.png` },
    { name: "Amazon.com.au", url: `${BASE}/d1a1ccae-160f-4df5-9f1e-e86106eb064d/Amazon_AU_GC_Image_Apr25_452_280.jpg` },
    { name: "Anaconda", url: `${BASE}/457bd0e9-58ad-45e8-b8a6-1519063b9926/ANACONDA_01_452_280.png` },
    { name: "Angus & Coote", url: `${BASE}/eda72f64-01d0-4380-ba8c-c4362b98ae5d/ANGUS_COOTE_452_280.jpg` },
    { name: "Apple", url: `${BASE}/2af63785-961b-4eb1-b9aa-de7bcaaaa60d/Apple_AU_B2C_Gift_Card_Image_452_280.png` },
    { name: "Archie Brothers", url: `${BASE}/0116cf54-790f-4bb2-9a02-9f4b30fca44d/archie_brothers_gc_452_280.jpg` },
    { name: "ASOS", url: `${BASE}/d51836b2-4416-4840-b9ff-5baacbb0dcbd/ASOS_452_280.png` },
    { name: "Autobarn", url: `${BASE}/90c2ac51-da98-4ada-add2-cf7126c89085/Autobarn_AU_GC_Image_2025_452_280.png` },
    { name: "Aveda", url: `${BASE}/cf2133e7-9993-4038-a432-054fb6c89b36/Aveda_Christmas_2021_452_280.jpg` },
    { name: "Avido Ristorante", url: `${BASE}/75b1d000-0642-4acd-9b1a-c60253400378/Avido_Ristorante_GC_452_280.jpg` },
    { name: "Babies R Us", url: `${BASE}/525a0aca-03d8-4cba-9df8-bda50487d401/Babys_R_Us_gc_452_280.png` },
    { name: "Baby Village", url: `${BASE}/feb694b4-d4f9-454e-b47c-188ff53fdf75/BABY_VILLAGE_AUD_452_280.png` },
    { name: "Barney Cools", url: `${BASE}/c82dd9a2-1daf-47d6-ad82-5b4ed4d50ca6/image_568_452_280.png` },
    { name: "BCF", url: `${BASE}/04898d10-1328-48c9-839f-dfc9fa18d1f0/BCF_01_452_280.png` },
    { name: "Be Fit Food", url: `${BASE}/38d68c86-89bb-4d53-bc91-80ea18b39d0a/Be_Fit_Food_452_280.png` },
    { name: "Beginning Boutique", url: `${BASE}/1c091ea9-dd32-45b0-b3bb-7fc84ac66c26/BEGINNING_BOUTIQUE_452_280.png` },
    { name: "Belluci's Manuka", url: `${BASE}/43ca9727-2c47-4dd4-8b4d-707e6205531f/Belluci%27s_Manuka_GC_452_280.jpg` },
    { name: "Best Beauty & Wellness", url: `${BASE}/224676a3-d4db-4038-8f8f-2031e271b823/Untitled_design_452_280.png` },
    { name: "Best&Less", url: `${BASE}/824e600e-3ca0-4eef-8a0e-6b858fe31415/BEST_LESS_AUD_GIVEX_452_280.jpg` },
    { name: "Best Restaurants", url: `${BASE}/584a78b6-72a7-4147-87ad-ddeffaff2fc5/best_restaurants_gc_452_280.png` },
    { name: "Betta Home & Living", url: `${BASE}/c181c5f7-8ee1-4f10-8047-c5bfacaa65fc/betta_home_gc_452_280.jpg` },
    { name: "Bib and Tucker", url: `${BASE}/46d9227c-7e03-4380-9321-6a1bdecafc1a/Bib_and_Tucker_GC_452_280.jpg` },
    { name: "BIG W", url: `${BASE}/0a0f5d76-cc6a-47c1-b0eb-6358a328f810/BIG_W_Updated_452_280.jpg` },
    { name: "Bill Fairies", url: `${BASE}/eba8a26c-7800-4b11-a5ae-24ae20258011/Bill_Fairies_AU_Gift_Card_Image_452_280.jpg` },
    { name: "Bing Lee", url: `${BASE}/9d61d4e3-042a-4657-b25f-4d2c36507c4a/Bing_Lee_GC_452_280.jpg` },
    { name: "Bistro Gitan", url: `${BASE}/bca91e7f-f167-44c9-9733-95b7d72f4142/Bistro_Gitan_GC_452_280.jpg` },
    { name: "Black Pepper", url: `${BASE}/946de3fe-40ad-41d6-b2c2-33d302e5d194/BLACK_PEPPER_452_280.png` },
    { name: "Blys In-Home Massage", url: `${BASE}/1ca99cb4-31cd-423f-8b78-d02909d676c5/BLYS_IN_HOME_MASSAGE_452_280.png` },
    { name: "Bobbi Brown", url: `${BASE}/771ba3fb-2537-4e73-883e-cd7a2e915188/Bobbi_Brown_GC_452_280.jpg` },
    { name: "Bodum", url: `${BASE}/2180e035-8dc2-4003-9733-1179a36e986f/bodum_452_280.jpg` },
    { name: "Bonds", url: `${BASE}/95af7763-cddf-49e7-88cc-64b1ecc0fcb7/BONDS_452_280.png` },
    { name: "Bottega", url: `${BASE}/be38409b-a204-45f2-8bbf-315d14264c65/Bottega_GC_452_280.jpg` },
    { name: "Bras N Things", url: `${BASE}/88f10aa2-65f1-44e6-b21d-d7927662d526/Bras_N_Things_AU_GC_Image_452_280.jpg` },
    { name: "BridgeClimb Sydney", url: `${BASE}/57e9e908-9bdd-46b9-aeb5-1c316b9d2006/BRIDGECLIMB_SYDNEY_452_280.png` },
    { name: "Brisbane Restaurants", url: `${BASE}/059f34da-b55c-4dfa-9b4a-a38f10a051ab/Brisbane_Restaurants_452_280.png` },
    { name: "Brown Cow", url: `${BASE}/4c9f3daf-6b06-472a-b128-b277ad9314c6/Brown_Cow_GC_452_280.jpg` },
    { name: "Bunnings Warehouse", url: `${BASE}/c587b0fd-e805-4640-aa0a-770928a2f2c0/Bunnings_Warehouse_Updated_452_280.jpg` },
    { name: "BWS", url: `${BASE}/e952eee4-80bc-44e9-8ccb-d5b6deacc1fa/BWS_GC_452_280.png` },
    { name: "Cable", url: `${BASE}/5e1acc0c-7a19-4209-bab4-c3633820a00d/Cable_Gc_452_280.jpg` },
    { name: "Captain Baxter", url: `${BASE}/e9a06e06-a56f-4a1b-8ab0-2539fd98585e/Captain_Baxter_GC_452_280.jpg` },
    { name: "Catalina Restaurant", url: `${BASE}/d7dca879-2732-461a-8047-8a06eeeea8b2/Catalina_Restaurant_GC_452_280.jpg` },
    { name: "Champion", url: `${BASE}/24e712df-d858-43fa-8799-b3c85990f5b5/Champion_AU_GC_Image_452_280.png` },
    { name: "Chemist Warehouse", url: `${BASE}/6b25c485-1b86-4ae4-9be6-5c83a843fbc2/CHEMIST_WAREHOUSE_AUD_452_280.jpg` },
    { name: "China Diner", url: `${BASE}/7b4b80f3-2594-4519-af60-7a9bb0bc8a38/China_Diner_GC_452_280.jpg` },
    { name: "Christmas Blessings", url: `${BASE}/5f315f0f-da4b-474d-81bd-84ce8638985f/Christmas_Blessings_Religious_SKU_animated_452_280.gif` },
    { name: "Chu The Phat", url: `${BASE}/c91273e1-818f-4220-a3d6-326e8a16dec9/Chu_The_Phat_GC_452_280.jpg` },
    { name: "City Beach", url: `${BASE}/f5d80a16-8a87-4020-b54d-c21f3a192ebd/City_Beach_AU_GC_Image_452_280.jpg` },
    { name: "City Cave", url: `${BASE}/24af8aed-ee9a-40d6-89b2-e88d8ebfa117/CITY_CAVE_AUD_01_452_280.png` },
    { name: "ClassBento", url: `${BASE}/86897225-2edb-45f9-a420-04f939cca4c2/classbento11_452_280.jpg` },
    { name: "Clinique", url: `${BASE}/649b1e90-3dbd-480e-b5b7-39e61eb46494/Clinique_AU_GC_Image_452_280.jpg` },
    { name: "Coast Port Beach", url: `${BASE}/5840e3d1-dfca-4385-ab30-8dbe68af6c8e/Coast_Port_Beach_AU_Gift_Card_Image_452_280.jpg` },
    { name: "Coles", url: `${BASE}/b3ff6a24-1cc8-4e46-8bf3-cc45e2d9c9c6/coles_gc_452_280.jpg` },
    { name: "Coles Groceries", url: `${BASE}/260df146-be17-4129-b531-e840e60ee605/Coles_Groceries_Updated_452_280.jpg` },
    { name: "Collins Booksellers", url: `${BASE}/ccfc4c7e-d24d-47db-8e55-1cecc905610e/Collins_booksellers_AU_GC_Image_452_280.jpg` },
    { name: "Copycat Bar & Restaurant", url: `${BASE}/f44ce827-d34e-49ec-af92-ae24e8e4ff3e/Copycat_Bar_%26_Restaurant_GC_452_280.jpg` },
    { name: "Cotton On", url: `${BASE}/df72c55c-f78c-4b1c-9c01-44fbf3905466/COTTON_ON_USD_452_280.jpg` },
    { name: "Cotton On: Body", url: `${BASE}/f60deb1a-661b-4c25-9632-f26c9db8c568/COTTON_ON_BODY_USD_452_280.png` },
    { name: "Cotton On: Kids", url: `${BASE}/6537abb7-5c8d-4064-a541-40e4aba11c0b/COTTON_ON_KIDS_USD_452_280.png` },
    { name: "Country Road", url: `${BASE}/ac5fb943-be73-45f0-855b-62058e074be3/COUNTRY_ROAD_452_280.jpg` },
    { name: "Cue", url: `${BASE}/d11f9ba0-7cc6-4d01-90e1-489c745a68f2/CUE_AU_452_280.jpg` },
    { name: "Culture Kings", url: `${BASE}/d7a2693a-1109-47b6-bacd-68789457d1ea/CULTURE_KINGS_452_280.jpg` },
    { name: "Dan Murphy's", url: `${BASE}/ee0d22f9-e490-4e81-bc9f-53f237b7b06f/Dan_Murphy_s_452_280.png` },
    { name: "David Jones", url: `${BASE}/298db893-510f-4322-808f-2d494627e2fd/David_Jones_GC_452_280.jpg` },
    { name: "DesignStuff", url: `${BASE}/afe246c2-abc9-42bd-bf38-db8be903810c/designstuff-jun-21-2_452_280.jpg` },
    { name: "DiDi Rideshare", url: `${BASE}/534edf14-4b90-466e-9533-a57c9ddc008d/DIDI_RIDESHARE_AUD_452_280.png` },
    { name: "Dotti", url: `${BASE}/c1e8936c-03fb-4c55-969f-ffc04c7f65e3/Dotti__Gift_Card_Image_452_280.jpg` },
    { name: "Drummond Golf", url: `${BASE}/25193540-6bdf-472b-99ff-857200bb86c0/DRUMMOND_GOLF_452_280.jpg` },
    { name: "Dusk", url: `${BASE}/5440df29-766b-4c7a-91bc-4ef8ef30af76/DUSK_AUD_452_280.png` },
    { name: "Dymocks", url: `${BASE}/262160ef-f25e-4f84-9298-3b0124978a14/DYMOCKS_452_280.png` },
    { name: "eBay", url: `${BASE}/da5f7995-3249-4bea-b26b-625506984a3c/ebay_au_gc_452_280.jpg` },
    { name: "EB Games", url: `${BASE}/147a9f88-8f77-4f84-972a-f9457336efc5/EB_Games_452_280.png` },
    { name: "Edible Blooms", url: `${BASE}/dae4d314-7a37-4ecd-8747-1b0d68d2e9bd/EDIBLE_BLOOMS_AU_452_280.png` },
    { name: "EG Fuel", url: `${BASE}/7eda8117-7da3-43b4-b2c5-a5d4b233bb86/eg_fuel_452_280.jpg` },
    { name: "Elite Supplements", url: `${BASE}/499c791b-185f-4412-b8bf-8cfe4c5b9551/ELITE_SUPPLEMENTS_452_280.png` },
    { name: "endota", url: `${BASE}/209cc48e-7f42-4404-9e8f-147c3da25e69/endota_gc_452_280.jpg` },
    { name: "Estée Lauder", url: `${BASE}/8596a886-430a-4b07-9a16-82250968b7ea/estee-lauder-2_452_280.jpg` },
    { name: "Estia", url: `${BASE}/ad82923e-5b2d-4182-bc0b-4bf8ad45ce49/Estia_GC_452_280.jpg` },
    { name: "ettitude", url: `${BASE}/bb2484cf-59a7-4907-9590-b057ea920505/ettitude_452_280.jpg` },
    { name: "Eva", url: `${BASE}/ddb33d98-4489-4428-bafd-be3bc20a3567/eva_gc_452_280.jpg` },
    { name: "Event Cinemas", url: `${BASE}/87412c87-d78f-4ec6-a5a1-4e275e3f21f7/EVENT_452_280.jpg` },
    { name: "Everlast", url: `${BASE}/2c577a31-9b61-431a-8e2b-1dd0d1de998b/Everlast_AU_GC_Image_452_280.jpg` },
    { name: "Everyday WISH", url: `${BASE}/d919279b-fcd0-4ab0-8a8f-6fbff6ee657a/Everyday_WISH__main_gc_452_280.jpg` },
    { name: "EveryPlate", url: `${BASE}/71000669-9b9a-498c-a08a-c086f2433461/EVERY_PLATE_AUD_452_280.png` },
    { name: "Flight Centre", url: `${BASE}/e3e4b18b-21c5-45b2-aa60-9f08f0d216e8/Flight_Centre_GC_Image_Apr24_452_280.jpg` },
    { name: "Foot Locker", url: `${BASE}/46f61ea8-484a-4ebb-82ef-2b5b39e8672b/foot_locker_gc_452_280.png` },
    { name: "Forever New", url: `${BASE}/9d754ec6-9363-4896-a438-d35af13a5acc/FOREVER_NEW_452_280.png` },
    { name: "Fortnite", url: `${BASE}/f0b7a251-fcaa-42f3-bdfa-778bf2456cf4/Fotnite_AU_GC_2025_452_280.jpg` },
    { name: "frank green", url: `${BASE}/c0144fac-63a5-4320-a275-5882bb988e9f/FRANK_GREEN_452_280.png` },
    { name: "Frederic", url: `${BASE}/7c322495-54bb-4463-9367-0b4a9473049e/Frederic_GC_452_280.jpg` },
    // ── Verified brand cards (G–M) from Prezzee React Query cache ──
    { name: "Gazman", url: `${BASE}/6524fe97-c203-4850-9fd1-59241d544c3a/GAZMAN_AUD_452_280.png` },
    { name: "Gemelli Broadbeach", url: `${BASE}/9d372caa-b19c-46d9-8e13-62b49a7dd8dd/Gemelli_Broadbeach_GC_452_280.jpg` },
    { name: "General Pants Co.", url: `${BASE}/f3f60cf4-6bca-459c-8842-e79d51ec484f/GENERAL_PANTS_CO_452_280.png` },
    { name: "Give Back $10", url: `${BASE}/06318d2d-50ec-4609-a1e4-6dd8f34c4e13/SKU-Prezzee_Give_Back_update_10_452_280.png` },
    { name: "Give Back $100", url: `${BASE}/86a7df92-4278-40ac-993d-eb10501c8b3a/SKU-Prezzee_Give_Back_update_100_452_280.png` },
    { name: "Give Back $20", url: `${BASE}/4f347cd8-bdd5-45b6-b103-e70e6d9b4203/SKU-Prezzee_Give_Back_update_20_452_280.png` },
    { name: "Give Back $50", url: `${BASE}/9431d1af-ef0c-46c9-aa4c-179732169e19/SKU-Prezzee_Give_Back_update_50_452_280.png` },
    { name: "Glassons", url: `${BASE}/2b0ba66a-867a-4643-8f00-0d07d3aa40cc/GLASSONS_452_280.png` },
    { name: "Global Experiences", url: `${BASE}/84a6fa5c-1cbb-4343-9ae7-f3f1930252ce/Global_Experiences_Card_AU_Gift_Card_Image_452_280.png` },
    { name: "Global Hotel", url: `${BASE}/29cfaf68-42db-4e4c-a2df-ae04ba9b2c85/Global_Hotel_Card_AU_Gift_Card_Image_452_280.jpg` },
    { name: "Goldmark", url: `${BASE}/168202d5-22c2-411c-ae9e-53a59cd0e7b7/goldmark-1021_452_280.jpg` },
    { name: "GoodnessMe", url: `${BASE}/57f63870-68fd-4857-8593-f90357118143/goodness-me-sep21_452_280.jpg` },
    { name: "Grahams", url: `${BASE}/598a12fb-3b2f-41c3-9a25-667ccd19b008/Grahams_Card_Image_04%3A05%3A22_452_280.png` },
    { name: "Grappa Ristorante & Bar", url: `${BASE}/da423648-ab2f-437b-be38-3b9bf32f39a2/Grappa_Ristorante_%26_Bar_GC_452_280.png` },
    { name: "Hallenstein Brothers", url: `${BASE}/921d5c7f-34c4-4c39-87d9-ac1e0133f904/HALLENSTEIN_BROTHERS_452_280.png` },
    { name: "Harris Farm", url: `${BASE}/b4cad89f-04d2-4899-b62d-8e992ca14328/HARRIS_FARM_AUD_452_280.png` },
    { name: "Harris Scarfe", url: `${BASE}/7b3170ac-7b0b-467f-a598-7125645e89a5/image_452_280.png` },
    { name: "Harvey Norman", url: `${BASE}/333dd529-18ac-4910-a093-df7ea844612b/Harvey_Norman_452_280.png` },
    { name: "HelloFresh", url: `${BASE}/d8ba1d2b-bd49-4f1f-a11f-9cb7935bd450/Hello_Fresh_452_280.png` },
    { name: "Hey You", url: `${BASE}/20f69590-29e2-44cc-ac2f-3419a52a6126/HEY_YOU_452_280.png` },
    { name: "Hijinx Hotel", url: `${BASE}/637fcb12-3d4c-4532-a041-054c141b0eef/hijinx-gc_452_280.jpg` },
    { name: "H&M", url: `${BASE}/086959ee-769c-43f0-9b6b-7a9af0f6e728/hm-1120_452_280.jpg` },
    { name: "Holey Moley", url: `${BASE}/08c92a4f-a0e4-4256-b1ca-c66f6fc949f7/holey-moley-gc_452_280.jpg` },
    { name: "Hotels.com", url: "https://assets-us-01.kc-usercontent.com/7af951a6-2a13-004b-f0eb-a87382a5b2e7/48bbae05-f16d-418f-a8a4-7ebfd941aade/Hotels.com%20%281%29.png" },
    { name: "House", url: `${BASE}/6eff2e54-f8fd-404c-8b8d-884e42e1b5f4/House__AU__Gift_Card_Image_452_280.jpg` },
    { name: "HOYTS", url: `${BASE}/7b0d781c-aed8-41bc-bce4-4188ff54f5aa/Hoyts_AU_GC_2025_452_280.jpg` },
    { name: "HOYTS LUX", url: `${BASE}/30f54345-7ac0-4967-9b84-0bb2c17f1283/HOYTS_LUX_AU_GC_Image_2025_452_280.jpg` },
    { name: "Hubbl", url: `${BASE}/941526bc-3c2f-4b58-9417-ccfc6c073fa2/Hubbl_gc_452_280.jpg` },
    { name: "Hush Puppies", url: `${BASE}/2f1b2934-4455-474e-a1d3-214332caf686/Hush_Puppies_AU_GC_Image_452_280.png` },
    { name: "Hype DC", url: `${BASE}/8472e903-c6ba-4840-8886-d2005038d226/HYPE_DC_AUD_452_280.png` },
    { name: "Ice Jewellery", url: `${BASE}/6b056a06-80cd-4d90-821c-e9089907278b/ICE_JEWELLERY_452_280.png` },
    { name: "IKEA", url: `${BASE}/ba50635c-d7e3-4381-b3bd-aae213f8e287/IKEA_AU_GC_Image_Apr25_452_280.jpg` },
    { name: "Inspire Me Naturally", url: `${BASE}/8305e6b0-c183-4099-b2e1-22a1c3fb8d8c/inspire-me-naturally-theme_452_280.jpg` },
    { name: "InStitchu", url: `${BASE}/30bee8fa-465c-43d5-9676-32a861732f0e/institchu-aug21_452_280.jpg` },
    { name: "isubscribe", url: `${BASE}/3d5a4948-1955-4604-83ac-1c8d95905f46/ISUBSCRIBE_452_280.png` },
    { name: "Jacqui E", url: `${BASE}/a23e884a-799a-443d-a6f9-456cab4272ff/Jacqui_E_AU_Gift_Card_Image_452_280.png` },
    { name: "JAG", url: `${BASE}/5ec9c64b-05fb-4f7d-8c78-2d65fe5bb0ba/jag_452_280.jpg` },
    { name: "Jaycar Electronics", url: `${BASE}/5d56ef3f-c01f-4239-bed2-0275ca55636b/Jaycar_AU_GC_Image_452_280.png` },
    { name: "Jay Jays", url: `${BASE}/b0c7ff05-1fc1-4359-b9bc-9140104ae474/jay-jays_2019_452_280.jpg` },
    { name: "JB Hi-Fi", url: `${BASE}/02ce361d-41cf-43a4-b000-efbb25d3960e/JB_HI-FI_SKU_452_280.png` },
    { name: "Jolleys Boathouse", url: `${BASE}/e323403b-c24e-4a7a-9c22-68735c5faef9/Jolleys_Boathouse_GC_452_280.jpg` },
    { name: "Jo Malone", url: `${BASE}/b1d31243-49d6-40dc-9624-86f7e9fa63e2/Jo_Malone_AU_GC_Image_452_280.jpg` },
    { name: "Just Jeans", url: `${BASE}/34a671e9-75d7-43ce-b90d-d93f412f94e7/Just_Jeans__Gift_Card_Image_452_280.jpg` },
    { name: "Kathmandu", url: `${BASE}/b8151db4-8254-4bfb-8f6a-0470b53547e7/KATHMANDU_452_280.png` },
    { name: "Kingpin", url: `${BASE}/3f794770-dea2-4296-8262-f966c6cd295a/KINGPIN_AUD_452_280.jpg` },
    { name: "Kmart", url: `${BASE}/309830b4-a83e-4303-8d06-082110d1645a/kmart__gc_452_280.jpg` },
    { name: "Kobo", url: `${BASE}/09e8ee0a-0f23-4f6d-b68d-0cf0845fce5b/Kobo__AU__GC_452_280.jpg` },
    { name: "Kogan", url: `${BASE}/2515c641-dd94-4fc6-980b-aa2c1146d60a/kogan_452_280.jpg` },
    { name: "Koko Black Chocolate", url: `${BASE}/6d102913-da4e-457b-9f53-ac43811d7331/KOKO_BLACK_CHOCOLATE_452_280.png` },
    { name: "Koo", url: `${BASE}/8d728c5e-1841-460e-b32b-ea09be71cd33/image2022-12-9_14-13-46_452_280.png` },
    { name: "Koutouki", url: `${BASE}/fa1472e6-5964-46df-b86b-6d94bfdbea7a/Koutouki_GC_452_280.jpg` },
    { name: "Kumo Izakaya", url: `${BASE}/28d47f4d-f458-45b1-8ee3-ddd791958a43/Kumo_Izakaya_GC_452_280.jpg` },
    { name: "La Capannina", url: `${BASE}/588a0a83-c980-4a55-a7f1-9097e60da38f/La_Capannina_GC_452_280.jpg` },
    { name: "La Mer", url: `${BASE}/e4900da3-3199-4d90-9daa-ad9d45234f8d/La_Mer_GC_452_280.jpg` },
    { name: "Latest Buy", url: `${BASE}/ca02b76b-a02b-48a8-855e-aaeb7a801ca3/latest-buy_452_280.jpg` },
    { name: "Laubman & Pank", url: `${BASE}/d9403bef-c370-4a6a-b4c7-be9c2f095016/LAUBMAN_PANK_452_280.png` },
    { name: "L'Hotel Gitan", url: `${BASE}/30330de6-4641-4294-a60c-47ca609aa053/L%27Hotel_Gitan_GC_452_280.jpg` },
    { name: "Libra Season", url: `${BASE}/a9516644-79f2-4372-8c8c-619795c49b81/Libra_SKU_390_154.png` },
    { name: "L'Occitane", url: `${BASE}/e9015245-ea3f-49d1-bd10-4c62b8e52f74/L_Occitane_AU_GC_Image_2025_452_280.jpg` },
    { name: "Lorna Jane", url: `${BASE}/9520e684-06f7-4fa9-aae3-69820ac76412/Lorna_Jane_452_280.png` },
    { name: "Lowes", url: `${BASE}/b137d497-d7be-45eb-adea-04081e33511e/Lowes_452_280.jpg` },
    { name: "Luxury Escapes", url: `${BASE}/e0dee491-79be-464b-afb4-dcd0c3a61e9e/Luxury_Escapes_GC_452_280.jpg` },
    { name: "LVLY", url: `${BASE}/3829db56-6f20-4c52-baf8-c9b3feca2358/LVLY_card_image_Dec21_452_280.jpg` },
    { name: "Lyca Mobile", url: `${BASE}/dd62ed25-06dc-457f-b7ed-ff1cd802c609/Lyca_Mobile_AU_GC_Image_%281%29_452_280.jpg` },
    { name: "M.A.C", url: `${BASE}/2d6eb5a6-a887-44d6-9c90-32e9facaf86d/MAC_452_280.jpg` },
    { name: "Machiavelli", url: `${BASE}/9b797c90-3ded-4c03-95c4-6b5ec06586ca/Machiavelli_GC_452_280.jpg` },
    { name: "Macpac", url: `${BASE}/8c95ece0-c014-4e86-8dbe-a6033ffc046c/Macpac_452_280.png` },
    { name: "Madame Wu", url: `${BASE}/8fcd19d9-c2da-4b4e-975e-9d162a9a65a7/Madam_Wu__GC_452_280.jpg` },
    { name: "MAISON de SABRÉ", url: `${BASE}/ca09faa7-7c4b-4840-9bee-78bd2f17b429/MAISON_de_SABR%C3%89_AU_GC_Image_2025_452_280.png` },
    { name: "Maldini", url: `${BASE}/75ac449d-4063-4df3-b505-99455f42ff0e/Maldini_GC_452_280.jpg` },
    { name: "Massimo Restaurant & Bar", url: `${BASE}/4cf346a7-5a5b-449b-a635-e55e125389b3/Massimo_Restaurant_%26_Bar_GC_452_280.jpg` },
    { name: "Meat District", url: `${BASE}/7a83c1c1-3e59-4e28-9b99-4a6e881a96cd/Meat_District_GC__452_280.jpg` },
    { name: "Meat & Wine Co (NSW)", url: `${BASE}/3c263750-bcbf-4633-a316-a8827a6155ab/Meat_%26_Wine_Co_GC_452_280.jpg` },
    { name: "Meat & Wine Co (Adelaide)", url: `${BASE}/45a60ec7-c49f-415d-809e-303d216e16cb/Meat_%26_Wine_Co_GC_452_280.jpg` },
    { name: "Meat & Wine Co (Canberra)", url: `${BASE}/a70d96ec-4403-4561-b974-27d6dd5a22fe/Meat_%26_Wine_Co_GC_452_280.jpg` },
    { name: "Meat & Wine Co (Perth)", url: `${BASE}/063dc500-dce5-42bc-ae9e-877b6b36a9d9/Meat_%26_Wine_Co_GC%2C_452_280.jpg` },
    { name: "Meat & Wine Co (Vic)", url: `${BASE}/e6becf09-a836-4342-b1cb-66c8147c31e4/Meat_%26_Wine_Co_GC_452_280.jpg` },
    { name: "Melbourne Restaurants", url: `${BASE}/0fae4386-9b6d-43f4-80cf-8bca7eb6e08d/Melbourne_Restaurants_452_280.png` },
    { name: "Michael Hill", url: `${BASE}/24971dec-cac4-4618-af09-fda428ec43e2/michael_hill_gc_452_280.jpg` },
    { name: "Mimco", url: `${BASE}/9952f748-18da-4852-a9d2-257648b0c1a8/MIMCO_452_280.png` },
    { name: "Minecraft", url: `${BASE}/53165658-8de0-445c-a60d-910da578a207/Minecraft_MineCoins_AU_GC_Image_452_280.jpg` },
    { name: "Minions", url: `${BASE}/56fddba0-5e03-4cef-8a91-914176a74712/Minions_-SKU1_390_154.png` },
    { name: "Mitch Dowd", url: `${BASE}/d00443e1-940e-4fc5-9c26-2c7c1c11633f/mitch-dowd-1021_452_280.jpg` },
    { name: "Movida", url: `${BASE}/4ae74dcf-4ed7-4845-8b0b-5b8c67904d91/Movida_GC_452_280.jpg` },
    { name: "Mr Roses", url: `${BASE}/092286b2-2174-4fa8-b987-294dda8c26fb/mrroses_gift-card_default_1_GC_452_280.jpg` },
    { name: "Mudbar Restaurant", url: `${BASE}/7f8a297f-347e-45c1-a8b7-583a8927d6e6/Mudbar_Restaurant_gc_452_280.jpg` },
    { name: "My Creative Box", url: `${BASE}/57f6f65c-4532-4161-8cc4-4669c68fe12d/My_Creative_Box_GC_452_280.png` },
    { name: "Myer", url: `${BASE}/87dc338c-dc0d-42ae-9eaf-5f64c3dbd7db/myer-orange_452_280.jpg` },
    // ── Verified brand cards (N–Z) from Prezzee React Query cache ──
    { name: "Nexon Game Card", url: `${BASE}/6780847f-9ad8-47b3-aea7-abef1d874041/Nexon_Game_Card_Updated_452_280.jpg` },
    { name: "Nine West", url: `${BASE}/a43aa099-99f8-4b8d-a0b5-c7c8adf8b166/NINE_WEST_452_280.png` },
    { name: "NuNu", url: `${BASE}/2e8cfc03-012a-43b2-ba8f-188a4295dd64/NuNu_GC_452_280.jpg` },
    { name: "O Bar and Dining", url: `${BASE}/adbda8f8-f401-4189-b11f-df81b11298f3/O_Bar_and_Dining_GC_452_280.jpg` },
    { name: "Officeworks", url: `${BASE}/0201936b-5ba5-4407-93a2-e3147272db09/Officeworks_Updated_452_280.jpg` },
    { name: "Oliveto Ristorante & Bar", url: `${BASE}/bc2a675c-1eb1-4cca-a642-bb72560e2aaa/Oliveto_Ristorante_%26_Bar_gc_452_280.jpg` },
    { name: "Omeros Bros", url: `${BASE}/a34da429-3dc4-45cb-b389-051632e2af0a/Omeros_Bros_GC_452_280.jpg` },
    { name: "OPSM", url: `${BASE}/b1a81f91-4e97-4088-806c-92be3c7dafbb/OPSM_452_280.png` },
    { name: "Ovolo Hotels", url: `${BASE}/f73672e1-d51d-478b-873e-ac6a9afd0484/Gift_Card_452x280_452_280.png` },
    { name: "Palermo", url: `${BASE}/6b605167-cb3e-4bb0-8242-82648f7c4e7b/Palermo_GC_452_280.jpg` },
    { name: "Pandora", url: `${BASE}/3efe397d-7fc4-443e-947e-b7bc7728edd7/PANDORA_452_280.png` },
    { name: "Pastuso", url: `${BASE}/d45b8a6c-e53c-425a-a690-e06435b8ea0b/Pastuso_GC_452_280.jpg` },
    { name: "Peter Alexander", url: `${BASE}/b1d71ad4-1efa-43aa-980e-798be8ee42e0/Peter_Alexander_AU_Gift_Card_Image_452_280.png` },
    { name: "ph360", url: `${BASE}/14258471-6a36-4d5d-90fb-f005a8cd5d0a/ph360_Dec21_452_280.jpg` },
    { name: "Plants in a Box", url: `${BASE}/621c8bae-2263-46bf-a81e-e0ca1a4da495/PLANTS_IN_A_BOX_AUD_452_280.png` },
    { name: "Platypus", url: `${BASE}/9b81fc99-cfb6-4838-88db-1d926b663eb7/PLATYPUS_AUD_452_280.png` },
    { name: "PlayStation Store", url: `${BASE}/60ad9ca3-9386-414e-9847-7cb907474a79/image_674_452_280.png` },
    { name: "Portmans", url: `${BASE}/65a08701-464b-4c77-89c5-2ea29f02fdf4/portmans_452_280.jpg` },
    { name: "Priceline Pharmacy", url: `${BASE}/d91d1661-e733-4c69-91e3-db3488802974/priceline-pharmacy_452_280.jpg` },
    { name: "Princess Polly", url: `${BASE}/e0693146-3072-475d-bc62-9f270a9a7686/PRINCESS_POLLY_USD_452_280.png` },
    { name: "Prouds the Jewellers", url: `${BASE}/1638e176-5596-47c2-b0a4-3c1575291ea3/PROUDS_THE_JEWELLERS_452_280.png` },
    { name: "Purebaby", url: `${BASE}/49766b8e-657d-48ea-b105-671a75bee8ae/Purebaby_452_280.png` },
    { name: "Razer Gold", url: `${BASE}/ac1fcf38-cbca-4d7a-a108-902b9a65ee58/Razer_Gold__AU_GC_Image_452_280.jpg` },
    { name: "RCVRI Martin Place", url: `${BASE}/ac7d308d-da73-46e2-954f-6ee020d9cfa8/RCVRI_AU_GC_Image_2025_452_280.jpg` },
    { name: "Rebel", url: `${BASE}/37adcfa2-6b9a-448e-86ef-a6e9bde8d27e/REBEL_452_280.png` },
    { name: "RedBalloon", url: `${BASE}/19ea86e2-3bf3-4f56-8188-90f6ada77eab/redballoon_gc_452_280.jpg` },
    { name: "Reebok", url: `${BASE}/ba9bbf20-0c3d-49e9-b6f5-88b0fff96889/Reebok_AU_GC_Image_452_280.png` },
    { name: "Rendezvous Hotels", url: `${BASE}/d659a892-163d-47eb-948b-a55fe2df5d83/Rendezvous_Hotels_GC_452_280.png` },
    { name: "RentacarGift", url: `${BASE}/217a1231-4c92-4a06-bc37-fab143cb82ff/rentacargift_gc_452_280.jpg` },
    { name: "Republica", url: `${BASE}/241641c3-cdef-4120-a51c-f6216be1e35b/Republica_GC_452_280.jpg` },
    { name: "Restaurants & Dining", url: `${BASE}/10ccdaee-e046-416c-9750-098e33c8d127/Restaurants_%26_Dining_452_280.png` },
    { name: "Review", url: `${BASE}/d1ba1c10-5b19-4899-be15-d9df7c4bdd62/REVIEW_452_280.png` },
    { name: "Riot Art & Craft", url: `${BASE}/0cbb2696-c350-49a6-bc45-fb7065777b26/RIOT_ART_CRAFT_AUD_452_280.png` },
    { name: "Riot League of Legends", url: `${BASE}/76099823-b78d-4c2d-9bc2-a7b7069ea177/riot-league-legends_452_280.jpg` },
    { name: "Robins Kitchen", url: `${BASE}/5b4d8936-0b44-47c9-ab3a-5a26c6b6e930/Robins_Kitchen_GC_452_280.png` },
    { name: "Rupert & Hound", url: `${BASE}/0fa13a26-217e-4ca1-9a18-8b13b369d596/Rupert_%26_Hound_GC_452_280.jpg` },
    { name: "Russell Athletic", url: `${BASE}/976c95ef-3c2c-4ae6-882b-5933ea686a0d/russell-alethic-1021_452_280.jpg` },
    { name: "SABA", url: `${BASE}/dc832f57-e3ea-4ee0-b1c1-f37d419d7ad9/SABA_452_280.png` },
    { name: "Salon Pay", url: `${BASE}/5731afd1-309a-40d0-97b4-24e7816eb848/SALON_PAY_AUD_452_280.png` },
    { name: "Sammys on the Marina", url: `${BASE}/2e23fd5f-a499-4cfa-ba86-0f0ea70d9d37/Sammys_on_the_Marina_GC_452_280.jpg` },
    { name: "Santa's Magical", url: `${BASE}/e8198317-4dd6-4f0b-b760-a8ff1ff4253e/Santa_Magical_Moments_SKU_452_280.png` },
    { name: "San Telmo", url: `${BASE}/da188213-6691-46cc-98cc-8a7d2134458f/San_Telmo_GC_452_280.jpg` },
    { name: "Secondary School Graduation", url: `${BASE}/1a3889d0-b734-4016-aa9d-c5d295a435c1/Secondary_School_Graduation_SKU_(1)_452_280.png` },
    { name: "Sephora", url: `${BASE}/aece8538-d60b-4d5b-af04-4e3c90cb81d3/Sephora_gc_452_280.jpg` },
    { name: "Sheike", url: `${BASE}/cd06d0f8-ff25-467c-b43f-51c016c81d44/SHEIKE_AUD_452_280.png` },
    { name: "SHEIN", url: `${BASE}/43506f89-9ced-4ff7-a3e7-48c0cf1e6036/Shein_452_280.png` },
    { name: "Shell", url: `${BASE}/e6f023f2-ab5e-4fd2-a8de-989b165800fd/Shell_GC_Image_080824_452_280.jpg` },
    { name: "Sheridan", url: `${BASE}/5aa4c295-67be-4c98-b9b2-fec87fc90158/SHERIDAN_452_280.png` },
    { name: "Shiels", url: `${BASE}/6826d4e2-a20d-4f80-9a32-0cfdbcb28d35/SHIELS_AUD_452_280.png` },
    { name: "Shoes & Sox", url: `${BASE}/6877e2ac-916a-4c70-9874-e679183c137b/Shoes_%26_Sox_AU_GC_Image_452_280.jpg` },
    { name: "Showpo", url: `${BASE}/f4d996ea-dab6-4f7d-9a6d-6728475073c1/SHOWPO_AUD_452_280.png` },
    { name: "Skechers", url: `${BASE}/f780e748-0184-4020-8007-932c9671f908/SKECHERS_USD_452_280.jpg` },
    { name: "Smiggle", url: `${BASE}/a1338f35-39a1-4b39-a562-d8fad8cdab47/Smiggle_AU_Gift_Card_Image_452_280.jpg` },
    { name: "Social Eating House + Bar", url: `${BASE}/ca904eac-8542-4094-9fa0-a4bbf58bd96d/Social_Eating_House_%2B_Bar_GC_452_280.jpg` },
    { name: "Sportscraft", url: `${BASE}/2bfd7bd2-85de-4baa-9b14-abbf1c3f33a9/SPORTSCRAFT_452_280.png` },
    { name: "SportsPower", url: `${BASE}/20ccbcff-f824-4122-85f2-6dd824071a19/SportsPower__AU__GC_452_280.jpg` },
    { name: "Spotlight", url: `${BASE}/8dc77f8f-6b3a-4120-b886-78803be8e495/Spotlight_452_280.jpg` },
    { name: "Star Car Wash", url: `${BASE}/87dd4adf-3abf-4d8d-ae81-34c66bc9b8cb/STAR_CAR_WASH_452_280.png` },
    { name: "Status Anxiety", url: `${BASE}/92f9f626-d1e8-4f0d-b0ce-9659adf5f171/Status_Anxiety_452_280.jpg` },
    { name: "Strandbags", url: `${BASE}/6f1ac61c-111f-4f23-8eb6-c54d3d1aab5d/Strandbags_AU_452_280.png` },
    { name: "Strike Bowling", url: `${BASE}/e3248730-a57d-411d-92aa-c24809d6824c/strike-gc_452_280.jpg` },
    { name: "Stylerunner", url: `${BASE}/02bfe8d2-c8ed-4f07-8074-cef4178f4b7f/stylerunner_452_280.jpg` },
    { name: "Sunglass Hut", url: `${BASE}/e29fff69-8be9-4faf-99c2-b9b5c71f1002/SUNGLASS_HUT_452_280.jpg` },
    { name: "Super", url: `${BASE}/bf1b2145-2956-458d-a2fd-d185ebcd97fb/Super_Gift_Card_452_280.jpg` },
    { name: "Supercheap Auto", url: `${BASE}/11d83acc-485b-4a4c-97b3-27bb6d15d57f/Supercheap_Auto_%5BAU%5D_GC_Image_452_280.jpg` },
    { name: "Superdry", url: `${BASE}/a121c24d-61b3-4477-9f25-ea4bb178db98/Superdry_AU_GC_Image_452_280.jpg` },
    { name: "Supre", url: `${BASE}/f710ab5f-9b15-4710-838f-e45e7ba687a0/SUPRE_AUD_452_280.png` },
    { name: "Swell Mullaloo Beach", url: `${BASE}/ebe8eee3-05b4-404e-ba1c-e68584f3ed43/Swell_Mullaloo_Beach_GC_452_280.jpg` },
    { name: "Sydney Restaurants", url: `${BASE}/e029e39e-b14f-45ed-b007-205824a020dc/Sydney_Restaurants_452_280.png` },
    { name: "T2", url: `${BASE}/a6fb3984-5d37-487e-bca5-53761fda726f/t2_gc_452_280.jpg` },
    { name: "Target", url: `${BASE}/5622ba82-4daa-4609-b49a-0d20397de887/target_gc_452_280.png` },
    { name: "Taxi Kitchen", url: `${BASE}/515ab3eb-7345-4223-9170-97c86ecf4a2a/Taxi_Kitchen_GC_452_280.jpg` },
    { name: "Temple & Webster", url: `${BASE}/98dff900-3efc-422d-b143-5fa8d68ee5af/Temple_%26_Webster_AU_GC_452_280.jpg` },
    { name: "Tequila Mockingbird", url: `${BASE}/2760bca2-88e2-4a65-80d2-9aac2653378a/Tequila_Mockingbird_GC_452_280.jpg` },
    { name: "TFE Hotels", url: `${BASE}/8db3cb55-90bd-49e1-81a6-0b916d965136/TFE_HOTELS_AU_GIFTCARD_IMAGE_452_280.jpg` },
    { name: "The AFL Store", url: `${BASE}/f631ab0a-fbfa-4bab-b168-8b2d4bff1109/THE_AFL_STORE_452_280.png` },
    { name: "The Athlete's Foot", url: `${BASE}/9d3f8898-0688-4145-9ec3-9fe15edd7274/THE_ATHLETE_S_FOOT_AUD_452_280.png` },
    { name: "The Beauty Chef", url: `${BASE}/66e640b7-3205-4a4f-8559-7573c8ab64f6/THE_BEAUTY_CHEF_AUD_2_452_280.jpg` },
    { name: "The Cinema", url: `${BASE}/24bc6d2b-d60b-4b0e-b473-d9492cb4b452/Cinema_Giftcard_452_280.jpg` },
    { name: "The Fight Factory", url: `${BASE}/4e09f7f2-6a31-4fb8-a1db-0bc665759836/fight-factory-jun21_452_280.jpg` },
    { name: "The Good Guys", url: `${BASE}/dafbda93-d96a-4108-b7db-9b94b851689f/The_Good_Guys_452_280.png` },
    { name: "The Hotel", url: `${BASE}/01d451d4-e9e3-4afa-84df-7088d0cc3d1f/THE_HOTEL_CARD_452_280.png` },
    { name: "THE ICONIC", url: `${BASE}/56bbc20e-7f7d-40ec-acfa-d3f96468a564/The_Iconic_AU_GC_Image_452_280.jpg` },
    { name: "The Movie Card", url: `${BASE}/1b51a9d7-e0cc-4c24-9e91-dc0bbe55cf0f/THE_MOVIE_CARD_452_280.png` },
    { name: "The Oodie", url: `${BASE}/2ff81db6-fedc-4470-a0cf-cfcd505b97e4/THE_OODIE_452_280.png` },
    { name: "The Pamper", url: `${BASE}/44eef2d5-b866-4f5c-9e1e-d7ea9f872d5c/Pamper_giftcard_452_280.jpg` },
    { name: "Thomas Sabo", url: `${BASE}/8ba13e85-a82c-483a-b44a-b30d9ede38c9/thomas-sabo_452_280.jpg` },
    { name: "Ticketmaster", url: `${BASE}/e5bfda89-6902-4f37-aad4-df1ae61081ef/ticketmaster__gc_452_280.jpg` },
    { name: "Timezone", url: `${BASE}/5b119b96-dbb5-413c-88d3-43e0250044ff/TIMEZONE_AUD_452_280.jpg` },
    { name: "TONI&GUY", url: `${BASE}/6c8eeede-d3af-4345-b044-938ebf4fa98a/TONIGUY_452_280.png` },
    { name: "Tooth Fairy", url: `${BASE}/ed9b7282-808a-43a2-89b4-39e73a691d7c/Tooth_Fairy_SKU_452_280.gif` },
    { name: "Toys R Us", url: `${BASE}/a90d8954-d154-47cc-a39c-bb0eb19a2833/Toys_R_Us_GIFTCARD_452_280.png` },
    { name: "Toyworld", url: `${BASE}/3efa8f77-cba3-4288-8565-d436b87fd977/Toyworld__AU__GC_452_280.jpg` },
    { name: "Travello", url: `${BASE}/cb4ae1a2-1e25-48cc-83a1-85483fcb552e/Travello_452_280.png` },
    { name: "Trenery", url: `${BASE}/0b4532e6-dfc3-45d3-8b2f-c4e33bf12f91/Trenery_452_280.jpg` },
    { name: "TripGift", url: `${BASE}/6e3eb361-cbf1-499f-a086-e0a0c8800264/Tripgift_AU_GC_Image_452_280.jpg` },
    { name: "Trolls Band Together", url: `${BASE}/bb49758e-0a5a-4cff-8820-5ae80c8169b9/TROLLS_PREZZEE_DESIGN_2024-02_(1)_390_154.png` },
    { name: "Typo", url: `${BASE}/9a38a1dd-3c8f-4290-9298-c81216cc7b90/TYPO_AUD_452_280.png` },
    { name: "Valorant", url: `${BASE}/9341643d-c8dd-41d5-bae4-29b98e0903c7/Valorant_ANZ_GC_Image_452_280.jpg` },
    { name: "Veronika Maine", url: `${BASE}/08715455-3881-454d-b1b4-48add956c08f/veronika-maine_452_280.jpg` },
    { name: "Vibe Hotels", url: `${BASE}/37b4d246-08f8-4815-b32c-3bd245b42971/VIBE_HOTELS_AUD_452_280.png` },
    { name: "Village Roadshow Theme Parks", url: `${BASE}/3e1dd1cc-850f-40ed-9ae8-cbcdb81680a7/VILLAGE_ROADSHOW_THEME_PARKS_452_280.jpg` },
    { name: "Vision Direct", url: `${BASE}/67a25e59-7eee-4004-962e-70b2ddfb86a5/vision-direct_452_280.jpg` },
    { name: "Vitable", url: `${BASE}/16676167-d2e2-4270-b680-edbb475c2f01/VITABLE_452_280.png` },
    { name: "WaazWaan", url: `${BASE}/16a4dc30-01f8-4fed-b49e-d9213ab2bdb4/WaazWaan_GC_452_280.jpg` },
    { name: "Watch Depot", url: `${BASE}/3585c112-eba8-4834-a0c5-c66dac63690f/Watch_Depot_Card_Image_04%3A05%3A22_452_280.png` },
    { name: "Watch Direct", url: `${BASE}/e451e83e-f211-4edb-b77e-f2367d0e0e9c/watch-direct-0921-v2_452_280.jpg` },
    { name: "Wattlebanks Coastal Cafe", url: `${BASE}/bfda8f3a-167f-4fbd-898b-7b8e7c165382/GC_-_Wattlebanks_Coastal_Cafe_and_Providore_-_Orford_GC_452_280.jpg` },
    { name: "Webjet", url: `${BASE}/170f5df1-20c3-4b9f-8717-3645df559886/webjet_nz_452_280.jpg` },
    { name: "Witchery", url: `${BASE}/b2fffd51-d768-48d0-877d-b9c5a7f9f7ff/WITCHERY_452_280.png` },
    { name: "Woolworths Essentials", url: `${BASE}/62976a6f-6a56-421c-ad16-0ad2bd81a708/Wookworth_Essentials_GC_452_280.jpg` },
    { name: "Woolworths Supermarket", url: `${BASE}/8f21fe3e-3d28-4e79-a406-26d742d8da77/Woolworths_Supermarket_452_280.png` },
    { name: "Xbox", url: `${BASE}/e3616adc-f4b3-4e38-b067-b74ec40c21ee/XBOX_GC_452_280.jpg` },
    { name: "Xbox Game Pass Essential", url: `${BASE}/d6c8017b-a17d-49a5-a3a2-27dd996126c2/Xbox_Game_Pass_Essential_AU_Gift_Card_Image_452_280.jpg` },
    { name: "Xbox Game Pass Ultimate", url: `${BASE}/d5df84c3-87c4-4b18-b2c7-67ab41f005f3/Xbox_Game_Pass_Ultimate_%28AU%29_Gift_Card_Image_452_280.jpg` },
    { name: "Youfoodz", url: `${BASE}/cb4009ee-9e93-4318-aa8e-898a5080220c/YOUFOODZ_452_280.jpg` },
    { name: "Zone Bowling", url: `${BASE}/c9188129-b018-45c8-99a7-2158a1ac633d/ZONE_BOWLING_AUD_452_280.png` },
    { name: "Zushi", url: `${BASE}/76259beb-db67-4c0d-b836-309096f4e432/Zushi_GC_452_280.jpg` },
];

const STEPS = [
    {
        number: "01",
        title: "Refer a tradie",
        desc: "Share your unique referral link with someone who needs a tradie. When the business wins the job, the lead is confirmed.",
    },
    {
        number: "02",
        title: "Job confirmed",
        desc: "Once both sides confirm the job was hired and completed, your reward is automatically calculated — no chasing required.",
    },
    {
        number: "03",
        title: "Card hits your inbox",
        desc: "Your Prezzee Smart Card arrives by email or SMS. Open it, pick your brands, and spend — it's that simple.",
    },
];

const TRUST = [
    { icon: Clock3, label: "Valid 3 years", sub: "No rush to spend" },
    { icon: Mail, label: "Instant delivery", sub: "Email or SMS" },
    { icon: Smartphone, label: "Prezzee Wallet app", sub: "Apple Wallet compatible" },
    { icon: Star, label: "400+ brands", sub: "One card, your choice" },
];

export default function RewardsPage() {
    return (
        <main className="min-h-screen bg-white">

            {/* ── HERO ── */}
            <section className="bg-[#EAF4FF] pt-32 pb-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Powered by Prezzee badge */}
                        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-blue-100 mb-8">
                            <span className="text-zinc-400 font-bold text-sm">Rewards powered by</span>
                            <Image
                                src={PREZZEE_LOGO}
                                alt="Prezzee"
                                width={72}
                                height={24}
                                className="h-5 w-auto"
                                unoptimized
                            />
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-6 leading-[1.05] tracking-tight font-display">
                            One Card.<br />
                            <span className="text-[#FF6600]">400+ Places</span> to Spend It.
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                            Earn a <strong className="text-zinc-900">$25 Prezzee Smart Card</strong> every time you invite 5 people who join TradeRefer. Spend it anywhere — Woolworths, Bunnings, Uber, Netflix and hundreds more.
                        </p>
                        {/* Prezzee Smart Card animated GIF */}
                        <div className="relative inline-block mb-8">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={PREZZEE_SMART_GIF}
                                alt="Prezzee Smart eGift Card"
                                className="w-64 md:w-80 rounded-2xl shadow-2xl mx-auto"
                            />
                        </div>

                        {/* $25 earn callout */}
                        <div className="inline-flex items-center gap-4 bg-white rounded-3xl px-8 py-5 shadow-xl border border-orange-100 mb-10">
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                                <Gift className="w-7 h-7 text-[#FF6600]" />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-zinc-900 text-xl leading-tight">Invite 5 → earn $25</p>
                                <p className="text-zinc-500 font-medium text-sm mt-0.5">Automatically issued when your 5th invitee becomes active</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/onboarding/referrer" className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55A00] text-white font-black px-10 py-4 rounded-full text-lg shadow-xl shadow-orange-200 transition-all hover:-translate-y-0.5">
                                Join as Referrer <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/onboarding/business" className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white font-black px-10 py-4 rounded-full text-lg transition-all hover:-translate-y-0.5">
                                Join as Business <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 font-display">How it works</h2>
                            <p className="text-xl text-zinc-500 font-medium">Three steps from referral to reward.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {STEPS.map((step) => (
                                <div key={step.number} className="relative">
                                    <div className="text-6xl font-black text-zinc-100 font-display mb-4 leading-none">{step.number}</div>
                                    <h3 className="text-xl font-black text-zinc-900 mb-3 font-display">{step.title}</h3>
                                    <p className="text-zinc-500 leading-relaxed font-medium">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SMART CARD EXPLAINER ── */}
            <section className="py-20 bg-[#EAF4FF]">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 mb-6">
                                    <span className="text-zinc-500 font-bold text-sm">Rewards by</span>
                                    <Image src={PREZZEE_LOGO} alt="Prezzee" width={72} height={24} className="h-5 w-auto" unoptimized />
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 font-display leading-tight">
                                    One card.<br />Endless choice.
                                </h2>
                                <p className="text-lg text-zinc-600 leading-relaxed mb-8 font-medium">
                                    The Prezzee Smart Card is the ultimate swap card. You receive one gift card — then choose which brands to spend it at. Split the balance however you like.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        { amount: "$40", brand: "Woolworths", color: "#00703E" },
                                        { amount: "$25", brand: "Uber", color: "#000000" },
                                        { amount: "$15", brand: "Netflix", color: "#E50914" },
                                    ].map(({ amount, brand, color }) => (
                                        <div key={brand} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-blue-50">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ backgroundColor: color }}>
                                                {brand[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-zinc-900">{brand}</p>
                                            </div>
                                            <span className="font-black text-zinc-900 text-lg">{amount}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between bg-zinc-50 rounded-2xl px-5 py-3 border border-zinc-100">
                                        <span className="font-bold text-zinc-400 text-sm">Total from one $80 card</span>
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                                            <Clock3 className="w-5 h-5 text-[#FF6600]" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 text-lg">Valid for 3 years</h3>
                                    </div>
                                    <p className="text-zinc-500 leading-relaxed">No pressure to spend immediately. Your Prezzee Smart Card stays active for 3 full years from the issue date.</p>
                                </div>
                                <div className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-[#FF6600]" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 text-lg">Instant delivery</h3>
                                    </div>
                                    <p className="text-zinc-500 leading-relaxed">Card arrives in your email inbox automatically — no waiting, no claiming, no paperwork.</p>
                                </div>
                                <div className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                                            <Smartphone className="w-5 h-5 text-[#FF6600]" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 text-lg">Prezzee Wallet + Apple Wallet</h3>
                                    </div>
                                    <p className="text-zinc-500 leading-relaxed">Store your card in the Prezzee app or add to Apple Wallet for one-tap access whenever you need it.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── BRAND GRID ── */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-4">
                            <div className="inline-flex items-center gap-2 mb-6">
                                <span className="text-zinc-400 font-bold text-sm">Spend your rewards at</span>
                                <Image src={PREZZEE_LOGO} alt="Prezzee" width={72} height={24} className="h-5 w-auto" unoptimized />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 font-display">Where you can spend</h2>
                            <p className="text-xl text-zinc-500 font-medium max-w-2xl mx-auto">
                                Your Prezzee Smart Card unlocks 400+ brands. Here&apos;s just a taste of where you can spend it.
                            </p>
                        </div>

                        {/* Invite CTA above grid */}
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 my-10 max-w-3xl mx-auto">
                            <div className="flex items-center gap-3">
                                <Gift className="w-6 h-6 text-[#FF6600] shrink-0" />
                                <p className="font-bold text-zinc-900">Invite 5 people who join → earn a <span className="text-[#FF6600]">$25 Smart Card</span>, automatically.</p>
                            </div>
                            <Link href="/onboarding/referrer" className="shrink-0 inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E55A00] text-white font-black px-6 py-3 rounded-full text-sm transition-colors whitespace-nowrap">
                                Start earning <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Card image grid — matches Prezzee store page layout, 452x280 aspect ratio */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {CARDS.map((card) => (
                                <Link
                                    key={card.name}
                                    href="/onboarding/referrer"
                                    className="group relative rounded-2xl overflow-hidden aspect-[452/280] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 bg-zinc-100"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={card.url}
                                        alt={card.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => { (e.currentTarget.closest("a") as HTMLElement | null)?.style.setProperty("display", "none"); }}
                                    />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-3">
                                        <span className="text-white font-black text-sm text-center leading-tight">Start earning</span>
                                        <span className="text-[#FF6600] font-black text-xs flex items-center gap-1">
                                            Join free <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </Link>
                            ))}

                            {/* "+307 more brands" tile */}
                            <Link
                                href="/onboarding/referrer"
                                className="group relative rounded-2xl overflow-hidden aspect-[452/280] flex flex-col items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                            >
                                <span className="text-white font-black text-2xl">+307</span>
                                <span className="text-zinc-400 font-bold text-xs text-center px-3 leading-tight">more brands</span>
                                <span className="text-[#FF6600] font-black text-xs flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                                    Join free <ArrowRight className="w-3 h-3" />
                                </span>
                            </Link>
                        </div>

                        <p className="text-center text-zinc-400 font-medium text-sm mt-8">
                            Available brands may vary. Full catalogue at{" "}
                            <a href="https://prezzee.com.au/en-au/au/store" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors">
                                prezzee.com.au
                            </a>
                        </p>
                    </div>
                </div>
            </section>

            {/* ── TRUST BADGES ── */}
            <section className="py-16 bg-zinc-50 border-y border-zinc-100">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                        {TRUST.map(({ icon: Icon, label, sub }) => (
                            <div key={label} className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100">
                                    <Icon className="w-6 h-6 text-[#FF6600]" />
                                </div>
                                <div>
                                    <p className="font-black text-zinc-900 text-sm">{label}</p>
                                    <p className="text-zinc-400 font-medium text-xs mt-0.5">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── INVITE MILESTONE ── */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <Users className="w-8 h-8 text-[#FF6600]" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 font-display">
                            Invite 5. Earn $25.
                        </h2>
                        <p className="text-xl text-zinc-500 leading-relaxed mb-4 font-medium">
                            Every time you invite 5 people — referrers or businesses — who become active on TradeRefer, we automatically send you a <strong className="text-zinc-900">$25 Prezzee Smart Card</strong>.
                        </p>
                        <p className="text-lg text-zinc-400 leading-relaxed mb-12">
                            No minimum spend. No claiming. No waiting. The card arrives in your inbox as soon as your 5th invitee becomes active.
                        </p>
                        {/* Progress illustration */}
                        <div className="flex items-center justify-center gap-3 mb-12">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs font-black text-zinc-400">Invite {n}</span>
                                </div>
                            ))}
                            <div className="flex flex-col items-center gap-2 ml-2">
                                <ChevronRight className="w-5 h-5 text-zinc-300 mb-5" />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center shadow-lg">
                                    <Gift className="w-6 h-6 text-[#FF6600]" />
                                </div>
                                <span className="text-xs font-black text-[#FF6600]">$25 Card</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/onboarding/referrer" className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55A00] text-white font-black px-10 py-4 rounded-full text-lg shadow-xl shadow-orange-200 transition-all hover:-translate-y-0.5">
                                Join as Referrer — it&apos;s free <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/dashboard/referrer" className="inline-flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black px-10 py-4 rounded-full text-lg transition-all">
                                Already a member
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
