import numpy as np
from scipy.optimize import curve_fit
import matplotlib.pyplot as plt

# Replace these with your actual data
R = np.array([20500, 51, 12])   # LDR resistance (Ω)
lux = np.array([0, 0.96, 1])    # Corresponding lux levels

def model(R, A, B):
    return A * (R ** B)

params, _ = curve_fit(model, R, lux)
A, B = params

print(f"Estimated formula: Lux ≈ {A:.2f} × R^{B:.2f}")

# Visualize
R_line = np.linspace(min(R), max(R), 100)
lux_fit = model(R_line, A, B)

plt.scatter(R, lux, label="Your Data")
plt.plot(R_line, lux_fit, color="green", label="Estimated Curve")
plt.xlabel("LDR Resistance (Ω)")
plt.ylabel("Lux")
plt.legend()
plt.grid(True)
plt.show()