import { message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useGetTrucks } from "../services/query/useGetTrucks";

export const useOwner = () => {
  const [selectedTruckIds, setSelectedTruckIds] = useState(new Set());
  const [trucksData, setTrucksData] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState({});
  const [selectedOwner, setSelectedOwner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: trucks, isLoading, isError } = useGetTrucks();
  const [start_date, setStart_date] = useState();
  const [end_date, setEnd_date] = useState(null);

  const handleSetStartDate = (date) => {
    setStart_date(date ? dayjs(date).format("YYYY-MM-DD") : null);
  };

  const handleSetEndDate = (date) => {
    setEnd_date(date ? dayjs(date).format("YYYY-MM-DD") : null);
  };

  const startDateForPicker = start_date ? dayjs(start_date) : null;
  const endDateForPicker = end_date ? dayjs(end_date) : null;

  useEffect(() => {
    setSelectedTruckIds(new Set());
    setTrucksData([]);
    setLoadingDrivers({});
  }, [selectedOwner]);

  const extractDriverInfo = (data) => {
    let driverName = "";
    if (data.driver) {
      if (typeof data.driver === "object" && data.driver.name) {
        driverName = data.driver.name;
      } else if (typeof data.driver === "string") {
        driverName = data.driver;
      }
    } else {
      driverName = data.driver_name || "";
    }

    let companyName = "";
    if (data.company) {
      if (typeof data.company === "object" && data.company.name) {
        companyName = data.company.name;
      } else if (typeof data.company === "string") {
        companyName = data.company;
      }
    } else {
      companyName = data.company_name || data.carrier_company || "";
    }

    return {
      driverName,
      companyName,
      totalAmount: data.total_amount || data.amount || 0,
      totalGross: data.total_gross || data.gross || 0,
      note: data.note || "",
      pdf: data.pdf || data.pdf_url || null,
      statementId: data.id || null,
    };
  };

  const fetchDriverData = async (item, driverId) => {
    if (!driverId || !start_date || !end_date) {
      setTrucksData((prev) =>
        prev.map((current) =>
          current.truckId === item.truckId
            ? { ...current, status: "manual" }
            : current
        )
      );
      return;
    }

    setLoadingDrivers((prev) => ({ ...prev, [item.truckId]: true }));

    try {
      const params = new URLSearchParams({
        driver: String(driverId),
        start_date: start_date,
        end_date: end_date,
      });

      const result = await apiRequest(
        `/calculations/statement-by-driver/?${params.toString()}`
      );

      let driverData = null;
      if (result && Array.isArray(result) && result.length > 0) {
        driverData = result[0];
      } else if (
        result &&
        typeof result === "object" &&
        !Array.isArray(result)
      ) {
        driverData = result;
      }

      if (driverData) {
        const {
          driverName,
          companyName,
          totalAmount,
          totalGross,
          note,
          pdf,
          statementId,
        } = extractDriverInfo(driverData);

        setTrucksData((prev) =>
          prev.map((current) =>
            current.truckId === item.truckId
              ? {
                  ...current,
                  status: "fetched",
                  driverName,
                  company: companyName,
                  totalAmount: String(totalAmount),
                  totalGross: String(totalGross),
                  escrow: current.escrow || "",
                  note,
                  pdf,
                  statementId,
                }
              : current
          )
        );
      } else {
        setTrucksData((prev) =>
          prev.map((current) =>
            current.truckId === item.truckId
              ? { ...current, status: "manual" }
              : current
          )
        );
      }
    } catch (error) {
      setTrucksData((prev) =>
        prev.map((current) =>
          current.truckId === item.truckId
            ? { ...current, status: "manual" }
            : current
        )
      );
    } finally {
      setLoadingDrivers((prev) => {
        const newState = { ...prev };
        delete newState[item.truckId];
        return newState;
      });
    }
  };

  const addTruck = async (truckIdStr) => {
    if (!truckIdStr) return;

    if (!start_date || !end_date) {
      return;
    }

    const truckId = parseInt(truckIdStr);
    const truck = trucks?.find((t) => {
      const tId = t.id || t._id;
      return String(tId) === String(truckId);
    });

    if (!truck) return;

    if (selectedTruckIds.has(truck.id || truck._id)) {
      return;
    }

    const newSelection = new Set(selectedTruckIds);
    const truckIdValue = truck.id || truck._id;
    newSelection.add(truckIdValue);
    setSelectedTruckIds(newSelection);

    const unitNumber = truck.unit_number || "N/A";
    const vin = truck.VIN || truck.vin || "N/A";

    let driverId = null;
    if (
      truck.driver &&
      Array.isArray(truck.driver) &&
      truck.driver.length > 0
    ) {
      driverId = truck.driver[0].id;
    } else if (
      truck.driver &&
      typeof truck.driver === "object" &&
      truck.driver.id
    ) {
      driverId = truck.driver.id;
    } else if (truck.driver && typeof truck.driver === "number") {
      driverId = truck.driver;
    } else if (truck.driver_id) {
      driverId = truck.driver_id;
    }

    const newItem = {
      truckId: truckIdValue,
      unitNumber: unitNumber,
      vin: vin,
      driverId: driverId,
      driverName: "",
      totalAmount: "",
      totalGross: "",
      escrow: "",
      note: "",
      status: "loading",
      company: "",
      pdf: null,
      statementId: null,
    };

    setTrucksData((prev) => [...prev, newItem]);

    if (driverId) {
      await fetchDriverData(newItem, driverId);
    } else {
      setTrucksData((prev) =>
        prev.map((item) =>
          item.truckId === newItem.truckId
            ? { ...item, status: "manual" }
            : item
        )
      );
    }
  };

  const removeTruck = (truckId) => {
    const newSelection = new Set(selectedTruckIds);
    newSelection.delete(truckId);
    setSelectedTruckIds(newSelection);
    setTrucksData((prev) => prev.filter((d) => d.truckId !== truckId));
  };

  const updateTruckData = (truckId, field, value) => {
    setTrucksData((prev) =>
      prev.map((item) =>
        item.truckId === truckId ? { ...item, [field]: value } : item
      )
    );
  };

  const formatExistingUnits = (existingUnits) => {
    return existingUnits.map((unit) => {
      const truckId = unit.truck?.id || unit.truck || unit.truck_id;
      const statementId =
        unit.statement?.id || unit.statement || unit.statement_id;
      const amount =
        typeof unit.amount === "string"
          ? unit.amount
          : String(unit.amount || "0.00");
      const escrow =
        typeof unit.escrow === "string"
          ? unit.escrow
          : String(unit.escrow || "0.00");

      const formattedUnit = {
        truck: Number(truckId),
        amount,
        escrow,
      };

      if (unit.driver && unit.driver.trim()) {
        formattedUnit.driver = unit.driver.trim();
      }
      if (statementId) {
        formattedUnit.statement = Number(statementId);
      }
      if (unit.note && unit.note.trim()) {
        formattedUnit.note = unit.note.trim();
      } else {
        formattedUnit.note = "";
      }

      return formattedUnit;
    });
  };

  const fetchExistingCalculation = async (owner, startDate, endDate) => {
    try {
      const checkParams = new URLSearchParams({
        search: owner,
        start_date: startDate,
        end_date: endDate,
      });
      const existingCalculations = await apiRequest(
        `/calculations/owner-calculation/?${checkParams.toString()}`
      );

      if (!existingCalculations) return null;

      const calculations = Array.isArray(existingCalculations)
        ? existingCalculations
        : existingCalculations.results || [];

      return (
        calculations.find(
          (c) =>
            (c.owner === owner || c.owner?.id === owner) &&
            c.start_date === startDate &&
            c.end_date === endDate
        ) || null
      );
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (onSuccess, onError) => {
    if (!selectedOwner) {
      if (onError) onError("Please select an owner.");
      return;
    }

    if (!start_date || !end_date) {
      if (onError) onError("Please select a date range.");
      return;
    }

    if (trucksData.length === 0) {
      if (onError) onError("Please add at least one unit.");
      return;
    }

    const hasLoading = trucksData.some(
      (t) => t.status === "loading" || loadingDrivers[t.truckId]
    );
    if (hasLoading) {
      if (onError) onError("Please wait for driver data to load.");
      return;
    }

    try {
      setIsSubmitting(true);

      const startDateStr = start_date;
      const endDateStr = end_date;

      const payloadUnits = trucksData
        .map((item) => {
          const truck = trucks?.find((t) => {
            const tId = t.id || t._id;
            return String(tId) === String(item.truckId);
          });

          if (!truck) {
            return null;
          }

          const truckId = Number(truck.id || truck._id);

          let amountValue = 0;
          const amountField = item.totalAmount || item.amount || "";
          if (amountField) {
            if (typeof amountField === "string") {
              const cleaned = amountField.replace(/[^0-9.-]/g, "");
              amountValue = parseFloat(cleaned) || 0;
            } else {
              amountValue = parseFloat(amountField) || 0;
            }
          }

          let escrowValue = 0;
          if (
            item.escrow !== null &&
            item.escrow !== undefined &&
            item.escrow !== ""
          ) {
            if (typeof item.escrow === "string") {
              const cleaned = item.escrow.replace(/[^0-9.-]/g, "");
              escrowValue = parseFloat(cleaned) || 0;
            } else {
              escrowValue = parseFloat(item.escrow) || 0;
            }
          }

          const unitPayload = {
            truck: truckId,
            amount: amountValue.toFixed(2),
            escrow: escrowValue.toFixed(2),
          };

          if (item.driverName && item.driverName.trim()) {
            unitPayload.driver = item.driverName.trim();
          }

          if (item.driverId) {
            unitPayload.driver_id = Number(item.driverId);
          }

          if (item.statementId) {
            unitPayload.statement = Number(item.statementId);
          }

          if (item.note && item.note.trim()) {
            unitPayload.note = item.note.trim();
          } else {
            unitPayload.note = "";
          }

          return unitPayload;
        })
        .filter((unit) => unit !== null);

      if (payloadUnits.length === 0) {
        if (onError) onError("No valid units to save.");
        setIsSubmitting(false);
        return;
      }

      const postPayload = {
        owner: selectedOwner,
        start_date: startDateStr,
        end_date: endDateStr,
        units: payloadUnits,
      };

      try {
        await apiRequest("/calculations/owner-calculation/", {
          method: "POST",
          body: JSON.stringify(postPayload),
        });

        if (onSuccess) onSuccess("Calculation created successfully!");
      } catch (postError) {
        message.error(
          postError?.response?.error ||
            postError?.message ||
            "Something went wrong while creating calculation."
        );
      }
    } catch (err) {
      const errorMsg =
        err?.message ||
        err?.response?.error ||
        err?.response?.detail ||
        "Something went wrong while creating/updating calculation.";
      if (onError) onError(errorMsg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedOwner("");
    setStart_date(undefined);
    setEnd_date(null);
    setSelectedTruckIds(new Set());
    setTrucksData([]);
    setLoadingDrivers({});
  };

  const Options = [];
  if (trucks) {
    trucks.forEach((truck) => {
      const truckId = truck.id || truck._id;
      if (!selectedTruckIds.has(truckId)) {
        Options.push({
          label: `${truck.unit_number || "N/A"}-${
            truck.VIN || truck.vin || "N/A"
          }`,
          value: String(truckId),
        });
      }
    });
  }

  return {
    trucks,
    isLoading,
    isError,
    selectedTruckIds,
    trucksData,
    loadingDrivers,
    selectedOwner,
    setSelectedOwner,
    isSubmitting,
    Options,
    addTruck,
    removeTruck,
    updateTruckData,
    handleSubmit,
    resetForm,
    start_date,
    end_date,
    setStart_date: handleSetStartDate,
    setEnd_date: handleSetEndDate,
    startDateForPicker,
    endDateForPicker,
  };
};
