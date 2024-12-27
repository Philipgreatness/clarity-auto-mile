import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Can register a new vehicle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const vehicleId = "1HGCM82633A123456";
    
    let block = chain.mineBlock([
      Tx.contractCall('auto_mile', 'register-vehicle', [
        types.ascii(vehicleId),
        types.ascii("Toyota"),
        types.ascii("Camry"),
        types.uint(2023)
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Verify vehicle details
    let query = chain.mineBlock([
      Tx.contractCall('auto_mile', 'get-vehicle-details', [
        types.ascii(vehicleId)
      ], deployer.address)
    ]);
    
    const vehicle = query.receipts[0].result.expectOk().expectTuple();
    assertEquals(vehicle['owner'], deployer.address);
    assertEquals(vehicle['manufacturer'], "Toyota");
  }
});

Clarinet.test({
  name: "Can transfer vehicle ownership",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const vehicleId = "1HGCM82633A123456";
    
    let block = chain.mineBlock([
      Tx.contractCall('auto_mile', 'register-vehicle', [
        types.ascii(vehicleId),
        types.ascii("Toyota"),
        types.ascii("Camry"),
        types.uint(2023)
      ], deployer.address),
      
      Tx.contractCall('auto_mile', 'transfer-ownership', [
        types.ascii(vehicleId),
        types.principal(wallet1.address)
      ], deployer.address)
    ]);
    
    block.receipts[1].result.expectOk().expectBool(true);
    
    // Verify new owner
    let query = chain.mineBlock([
      Tx.contractCall('auto_mile', 'get-vehicle-details', [
        types.ascii(vehicleId)
      ], deployer.address)
    ]);
    
    const vehicle = query.receipts[0].result.expectOk().expectTuple();
    assertEquals(vehicle['owner'], wallet1.address);
  }
});

Clarinet.test({
  name: "Can create and query lease agreement",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const vehicleId = "1HGCM82633A123456";
    
    let block = chain.mineBlock([
      Tx.contractCall('auto_mile', 'register-vehicle', [
        types.ascii(vehicleId),
        types.ascii("Toyota"),
        types.ascii("Camry"),
        types.uint(2023)
      ], deployer.address),
      
      Tx.contractCall('auto_mile', 'create-lease', [
        types.ascii(vehicleId),
        types.principal(wallet1.address),
        types.uint(1625097600), // July 1, 2021
        types.uint(1656633600), // July 1, 2022
        types.uint(500)
      ], deployer.address)
    ]);
    
    const leaseId = block.receipts[1].result.expectOk();
    
    // Query lease details
    let query = chain.mineBlock([
      Tx.contractCall('auto_mile', 'get-lease-details', [
        leaseId
      ], deployer.address)
    ]);
    
    const lease = query.receipts[0].result.expectOk().expectTuple();
    assertEquals(lease['vehicle-id'], vehicleId);
    assertEquals(lease['lessee'], wallet1.address);
    assertEquals(lease['monthly-payment'], '500');
  }
});