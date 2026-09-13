// Multiple return values are the norm; the error is always last.
func parsePort(s string) (int, error) {
    n, err := strconv.Atoi(s)
if err != nil {
return 0, fmt.Errorf("parse port %q: %w", s, err)
}
if n < 1 || n > 65535 {
return 0, fmt.Errorf("port %d out of range", n)
}
return n, nil
}
// Variadic parameters become a slice inside the function.
func sum(nums ...int) int {
    total := 0
for _, n := range nums {
        total += n
}
return total
}
sum(1, 2, 3)
sum(mySlice...) // spread an existing slice
// Functions are values; closures capture variables by reference.
func counter() func() int {
    n := 0
return func() int { n++; return n }
}