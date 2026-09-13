type Status int
const (
    StatusOpen Status = iota // 0
    StatusDone               // 1 (repeats the expression with iota=1)
    StatusArchived           // 2
)
func (s Status) String() string { // makes fmt print the name, not the number
switch s {
case StatusOpen:
return "open"
case StatusDone:
return "done"
case StatusArchived:
return "archived"
}
return fmt.Sprintf("Status(%d)", int(s))
}
