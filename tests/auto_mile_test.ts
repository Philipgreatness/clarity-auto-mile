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
  name: "Can add and query maintenance records",
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
