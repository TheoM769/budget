from budget.models import Transaction

def main():
    t = Transaction(id=1, amount=100.0, description="Grocery shopping", date="2024-06-01")
    print(t)
    print("Hello from budget!")


if __name__ == "__main__":
    main()
