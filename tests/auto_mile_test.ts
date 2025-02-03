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
        types.uint(2023),
        types.uint(0)
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    let query = chain.mineBlock([
      Tx.contractCall('auto_mile', 'get-vehicle-details', [
        types.ascii(vehicleId)
      ], deployer.address)
    ]);
    
    const vehicle = query.receipts[0].result.expectOk().expectTuple();
    assertEquals(vehicle['owner'], deployer.address);
    assertEquals(vehicle['manufacturer'], "Toyota");
    assertEquals(vehicle['mileage'], '0');
  }
});

Clarinet.test({
  name: "Can add and query maintenance records with valid mileage",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const serviceProvider = accounts.get('wallet_1')!;
    const vehicleId = "1HGCM82633A123456";
    
    let block = chain.mineBlock([
      Tx.contractCall('auto_mile', 'register-vehicle', [
        types.ascii(vehicleId),
        types.ascii("Toyota"),
        types.ascii("Camry"),
        types.uint(2023),
        types.uint(0)
      ], deployer.address),
      
      Tx.contractCall('auto_mile', 'add-maintenance-record', [
        types.ascii(vehicleId),
        types.uint(1625097600),
        types.ascii("Oil Change"),
        types.principal(serviceProvider.address),
        types.uint(5000),
        types.uint(50),
        types.ascii("Regular maintenance")
      ], deployer.address)
    ]);
    
    const recordId = block.receipts[1].result.expectOk();
    
    let query = chain.mineBlock([
      Tx.contractCall('auto_mile', 'get-maintenance-record', [
        recordId
      ], deployer.address),
      
      Tx.contractCall('auto_mile', 'get-vehicle-details', [
        types.ascii(vehicleId)
      ], deployer.address)
    ]);
    
    const record = query.receipts[0].result.expectOk().expectTuple();
    assertEquals(record['service-type'], "Oil Change");
    assertEquals(record['mileage'], '5000');
    
    const vehicle = query.receipts[1].result.expectOk().expectTuple();
    assertEquals(vehicle['mileage'], '5000');
  }
});

Clarinet.test({
  name: "Cannot add maintenance record with invalid mileage",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const serviceProvider = accounts.get('wallet_1')!;
    const vehicleId = "1HGCM82633A123456";
    
    let block = chain.mineBlock([
      Tx.contractCall('auto_mile', 'register-vehicle', [
        types.ascii(vehicleId),
        types.ascii("Toyota"),
        types.ascii("Camry"),
        types.uint(2023),
        types.uint(5000)
      ], deployer.address),
      
      Tx.contractCall('auto_mile', 'add-maintenance-record', [
        types.ascii(vehicleId),
        types.uint(1625097600),
        types.ascii("Oil Change"),
        types.principal(serviceProvider.address),
        types.uint(4000),  // Lower than current mileage
        types.uint(50),
        types.ascii("Regular maintenance")
      ], deployer.address)
    ]);
    
    block.receipts[1].result.expectErr().expectUint(105);
  }
});

Clarinet.test({
  name: "Cannot create lease with invalid dates",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const lessee = accounts.get('wallet_1')!;
    const vehicleId = "1HGCM82633A123456";
    
    let block = chain.mineBlock([
      Tx.contractCall('auto_mile', 'register-vehicle', [
        types.ascii(vehicleId),
        types.ascii("Toyota"),
        types.ascii("Camry"),
        types.uint(2023),
        types.uint(0)
      ], deployer.address),
      
      Tx.contractCall('auto_mile', 'create-lease', [
        types.ascii(vehicleId),
        types.principal(lessee.address),
        types.uint(1625097600),
        types.uint(1625097500),  // End date before start date
        types.uint(500),
        types.uint(12000)
      ], deployer.address)
    ]);
    
    block.receipts[1].result.expectErr().expectUint(105);
  }
});
