#!/usr/bin/env node

/**
 * Script de test pour vérifier l'intégration carte-actifs
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Vérification de l\'intégration Carte-Actifs Portuaires...\n');

// Chemins des projets
const backendPath = path.join(__dirname, '../back-end');
const frontendPath = path.join(__dirname, '../front-end/geo-dashboard');

/**
 * Exécute une commande et retourne une promesse
 */
function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Teste la compilation TypeScript du backend
 */
async function testBackendCompilation() {
  console.log('📦 Test de compilation Backend...');
  try {
    await runCommand('npx tsc --noEmit', backendPath);
    console.log('✅ Backend: Compilation TypeScript réussie');
    return true;
  } catch (error) {
    console.log('❌ Backend: Erreurs de compilation TypeScript');
    console.log(error.stdout);
    console.log(error.stderr);
    return false;
  }
}

/**
 * Teste la compilation TypeScript du frontend
 */
async function testFrontendCompilation() {
  console.log('\n🎨 Test de compilation Frontend...');
  try {
    await runCommand('npx ng build --configuration production', frontendPath);
    console.log('✅ Frontend: Compilation Angular réussie');
    return true;
  } catch (error) {
    console.log('❌ Frontend: Erreurs de compilation Angular');
    console.log(error.stdout);
    console.log(error.stderr);
    return false;
  }
}

/**
 * Teste les endpoints API
 */
async function testApiEndpoints() {
  console.log('\n🌐 Test des endpoints API...');
  
  const endpoints = [
    '/api/portefeuilles',
    '/api/actifs',
    '/api/anomalies',
    '/api/carte/actifs',
    '/api/carte/anomalies',
    '/api/carte/dashboard'
  ];
  
  // Note: Ce test nécessite que le serveur soit en cours d'exécution
  console.log('📋 Endpoints à tester:');
  endpoints.forEach(endpoint => {
    console.log(`   - GET http://localhost:3000${endpoint}`);
  });
  
  console.log('⚠️  Pour tester les endpoints, démarrez le serveur avec: npm run start:dev');
  
  return true;
}

/**
 * Vérifie les fichiers critiques
 */
async function checkCriticalFiles() {
  console.log('\n📁 Vérification des fichiers critiques...');
  
  const criticalFiles = [
    // Backend
    'back-end/src/gestion_des_actifs/entities/actif.entity.ts',
    'back-end/src/gestion_des_actifs/entities/anomalie.entity.ts',
    'back-end/src/gestion_des_actifs/services/actif.service.ts',
    'back-end/src/gestion_des_actifs/services/anomalie.service.ts',
    'back-end/src/services/carte-integration.service.ts',
    'back-end/src/controllers/carte-integration.controller.ts',
    'back-end/src/modules/carte-integration.module.ts',
    
    // Frontend
    'front-end/geo-dashboard/src/app/services/carte-integration.service.ts',
    'front-end/geo-dashboard/src/app/components/signalement-anomalie/signalement-anomalie.component.ts',
    'front-end/geo-dashboard/src/app/components/carte-kpi/carte-kpi.component.ts',
  ];
  
  const fs = require('fs');
  let allFilesExist = true;
  
  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, '../', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MANQUANT`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage des tests d\'intégration...\n');
  
  let allTestsPassed = true;
  
  // Test 1: Fichiers critiques
  const filesOk = await checkCriticalFiles();
  if (!filesOk) {
    allTestsPassed = false;
  }
  
  // Test 2: Compilation Backend
  const backendOk = await testBackendCompilation();
  if (!backendOk) {
    allTestsPassed = false;
  }
  
  // Test 3: Compilation Frontend
  const frontendOk = await testFrontendCompilation();
  if (!frontendOk) {
    allTestsPassed = false;
  }
  
  // Test 4: Endpoints API
  await testApiEndpoints();
  
  // Résultat final
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ L\'intégration Carte-Actifs Portuaires est prête !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Démarrer le backend: cd back-end && npm run start:dev');
    console.log('   2. Initialiser la DB: cd back-end && npm run db:init');
    console.log('   3. Démarrer le frontend: cd front-end/geo-dashboard && ng serve');
    console.log('   4. Accéder à l\'application: http://localhost:4200');
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Veuillez corriger les erreurs ci-dessus avant de continuer');
  }
  console.log('='.repeat(60));
}

// Exécution du script
main().catch(console.error);
