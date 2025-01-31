# AutoMile Smart Contract

A blockchain-based vehicle leasing and ownership management system built on Stacks.

## Features
- Register new vehicles with unique identifiers
- Transfer vehicle ownership
- Create and manage lease agreements
- Track vehicle history and payments
- Query vehicle status and ownership details
- Comprehensive maintenance history tracking with mileage updates
- Service record management with provider details and costs

## Contract Functions
- `register-vehicle`: Register a new vehicle in the system
- `transfer-ownership`: Transfer vehicle ownership between parties 
- `create-lease`: Create a new vehicle lease agreement
- `make-payment`: Process lease payments
- `add-maintenance-record`: Add vehicle service and maintenance records
- `get-vehicle-details`: Query vehicle information
- `get-lease-details`: Get details of a lease agreement
- `get-maintenance-record`: Retrieve maintenance history records

## Testing
Run tests using Clarinet: `clarinet test`

## Vehicle Maintenance Tracking
The system now includes comprehensive maintenance history tracking:
- Record service dates, types, and providers
- Track mileage updates
- Store maintenance costs
- Add detailed service notes
- Automatic vehicle mileage updates with maintenance records
