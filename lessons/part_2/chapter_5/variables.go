var count int // declared, zero value 0
var name = "shelf" // type inferred: string
port := 8080 // short declaration; only inside functions
a, b := 1, "two" // multiple, mixed types
x, y := 0, 0
x, y = y, x              // swap; = assigns, := declares
const maxRetries = 3 // untyped constant: adapts to context
const timeout time.Duration = 5 * time.Second