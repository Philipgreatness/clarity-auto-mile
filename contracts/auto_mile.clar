;; AutoMile - Vehicle leasing and ownership smart contract

;; Error codes
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-already-exists (err u103))
(define-constant err-invalid-state (err u104))

;; Data structures
(define-map vehicles
  { vehicle-id: (string-ascii 17) }  ;; VIN number
  {
    owner: principal,
    manufacturer: (string-ascii 50),
    model: (string-ascii 50),
    year: uint,
    status: (string-ascii 20)
  }
)

(define-map leases
  { lease-id: uint }
  {
    vehicle-id: (string-ascii 17),
    lessee: principal,
    lessor: principal,
    start-date: uint,
    end-date: uint,
    monthly-payment: uint,
    status: (string-ascii 20)
  }
)

;; Storage
(define-data-var lease-nonce uint u0)

;; Private functions
(define-private (is-vehicle-owner (vehicle-id (string-ascii 17)) (caller principal))
  (match (map-get? vehicles {vehicle-id: vehicle-id})
    vehicle (is-eq (get owner vehicle) caller)
    false
  )
)

;; Public functions
(define-public (register-vehicle 
    (vehicle-id (string-ascii 17))
    (manufacturer (string-ascii 50))
    (model (string-ascii 50))
    (year uint))
  (let ((vehicle-data {
      owner: tx-sender,
      manufacturer: manufacturer,
      model: model,
      year: year,
      status: "active"
    }))
    (match (map-get? vehicles {vehicle-id: vehicle-id})
      existing-data err-already-exists
      (begin
        (map-set vehicles {vehicle-id: vehicle-id} vehicle-data)
        (ok true))
    )
  )
)

(define-public (transfer-ownership 
    (vehicle-id (string-ascii 17))
    (new-owner principal))
  (if (is-vehicle-owner vehicle-id tx-sender)
    (match (map-get? vehicles {vehicle-id: vehicle-id})
      vehicle (begin
        (map-set vehicles 
          {vehicle-id: vehicle-id}
          (merge vehicle {owner: new-owner}))
        (ok true))
      err-not-found)
    err-unauthorized)
)

(define-public (create-lease
    (vehicle-id (string-ascii 17))
    (lessee principal)
    (start-date uint)
    (end-date uint)
    (monthly-payment uint))
  (let ((lease-id (+ (var-get lease-nonce) u1)))
    (if (is-vehicle-owner vehicle-id tx-sender)
      (begin
        (map-set leases
          {lease-id: lease-id}
          {
            vehicle-id: vehicle-id,
            lessee: lessee,
            lessor: tx-sender,
            start-date: start-date,
            end-date: end-date,
            monthly-payment: monthly-payment,
            status: "active"
          })
        (var-set lease-nonce lease-id)
        (ok lease-id))
      err-unauthorized))
)

(define-public (make-payment (lease-id uint))
  (match (map-get? leases {lease-id: lease-id})
    lease (if (is-eq (get lessee lease) tx-sender)
            (ok true)  ;; In a real implementation, this would handle payment logic
            err-unauthorized)
    err-not-found)
)

;; Read-only functions
(define-read-only (get-vehicle-details (vehicle-id (string-ascii 17)))
  (match (map-get? vehicles {vehicle-id: vehicle-id})
    vehicle (ok vehicle)
    err-not-found)
)

(define-read-only (get-lease-details (lease-id uint))
  (match (map-get? leases {lease-id: lease-id})
    lease (ok lease)
    err-not-found)
)